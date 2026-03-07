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
        console.log("Auth: Initializing listener...");
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            console.log("Auth: State changed, user:", authUser?.email);
            
            if (authUser) {
                const email = authUser.email?.toLowerCase() || "";
                console.log("Auth: Checking authorization for:", email);
                
                try {
                    const userDocRef = doc(db, "authorized_users", email);
                    const userDoc = await getDoc(userDocRef);
                    
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        console.log("Auth: User authorized with role:", userData.role);
                        
                        // Sync Google Profile Info back to Firestore Authorized User
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
                                await setDoc(userDocRef, updateData, { merge: true });
                            }
                        } catch (syncErr) {
                            console.warn("Auth: Failed to sync metadata:", syncErr);
                        }

                        setRole(userData.role || 'user');
                        setIsAuthorized(true);
                    } else {
                        console.warn("Auth: User NOT in authorized_users collection");
                        setRole(null);
                        setIsAuthorized(false);
                    }
                } catch (error) {
                    console.error("Auth: Firestore error:", error);
                    setRole(null);
                    setIsAuthorized(false);
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
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Error signing in with Google:", error);
        }
    };

    const signOut = async () => {
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
