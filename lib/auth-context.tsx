"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    signInWithPopup,
    signOut as firebaseSignOut,
    User
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase";

interface AuthContextType {
    user: User | null;
    role: 'admin' | 'user' | null;
    isAuthorized: boolean;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<'admin' | 'user' | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            console.warn("Auth: Firebase not initialized. Skipping listener.");
            setLoading(false);
            return;
        }

        console.log("Auth: Initializing listener...");
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            console.log("Auth: State changed, user:", authUser?.email);
            
            if (authUser) {
                const email = authUser.email?.toLowerCase() || "";
                console.log("Auth: Checking authorization for:", email);
                
                try {
                    if (!db) throw new Error("Firestore not initialized");

                    // Optimistic UI: Check Cache for instant login
                    let cachedRole: string | null = null;
                    try {
                        cachedRole = localStorage.getItem(`role_${email}`);
                    } catch {
                        console.warn("Auth: LocalStorage access denied");
                    }

                    if (cachedRole) {
                        console.log("Auth: Restored role from cache, unblocking UI instantly");
                        setRole(cachedRole as 'admin' | 'user');
                        setIsAuthorized(true);
                        setUser(authUser);
                        setLoading(false);
                    }

                    const userDocRef = doc(db, "authorized_users", email);
                    
                    // Fetch with a timeout so it never hangs infinitely
                    const fetchWithTimeout = new Promise<import('firebase/firestore').DocumentSnapshot>((resolve, reject) => {
                        const timer = setTimeout(() => reject(new Error("Timeout ao conectar com Firebase")), 8000);
                        getDoc(userDocRef).then((res) => {
                            clearTimeout(timer);
                            resolve(res);
                        }).catch(err => {
                            clearTimeout(timer);
                            reject(err);
                        });
                    });

                    const userDoc = await fetchWithTimeout;
                    
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        console.log("Auth: User authorized with role:", userData.role);
                        
                        // Sync Google Profile Info back to Firestore
                        try {
                            const updateData: Record<string, string> = {
                                updated_at: new Date().toISOString(),
                            };
                            
                            if (authUser.displayName && (!userData.full_name || userData.full_name === "Administrador Inicial")) {
                                updateData.full_name = authUser.displayName;
                            }
                            if (authUser.photoURL && !userData.avatar_url) {
                                updateData.avatar_url = authUser.photoURL;
                            }

                            if (Object.keys(updateData).length > 1) {
                                setDoc(userDocRef, updateData, { merge: true }).catch(err => {
                                    console.warn("Auth: Failed to sync metadata:", err);
                                });
                            }
                        } catch (syncErr) {
                            console.warn("Auth: Failed to prepare metadata sync:", syncErr);
                        }

                        const newRole = userData.role || 'user';
                        setRole(newRole);
                        setIsAuthorized(true);
                        localStorage.setItem(`role_${email}`, newRole);
                    } else {
                        console.warn("Auth: User NOT in authorized_users collection");
                        setRole(null);
                        setIsAuthorized(false);
                        try { localStorage.removeItem(`role_${email}`); } catch {}
                    }
                } catch (error) {
                    console.error("Auth: Firestore error or Timeout:", error);
                    // On timeout or offline, if we have cache, we keep it. If not, we block.
                    let hasCache = false;
                    try { hasCache = !!localStorage.getItem(`role_${email}`); } catch {}
                    
                    if (!hasCache) {
                        setRole(null);
                        setIsAuthorized(false);
                        // Optional fallback: alert the user
                        // alert("O servidor demorou muito para responder. Tente novamente.");
                    }
                } finally {
                    setUser(authUser);
                    setLoading(false);
                }
            } else {
                console.log("Auth: No user logged in.");
                setUser(null);
                setRole(null);
                setIsAuthorized(false);
                setLoading(false);
            }
        }, (error) => {
            console.error("Auth: onAuthStateChanged error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        if (!auth || !googleProvider) return;
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Error signing in with Google:", error);
        }
    };

    const signOut = async () => {
        if (!auth) return;
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, role, isAuthorized, loading, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
