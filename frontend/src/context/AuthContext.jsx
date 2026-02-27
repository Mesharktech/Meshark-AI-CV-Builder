import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, loginWithGoogle, logoutUser } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });
        return unsub;
    }, []);

    return (
        <AuthContext.Provider value={{ user, loginWithGoogle, logoutUser, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
