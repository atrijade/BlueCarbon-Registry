import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../services/supabase';

const AuthContext = createContext();

const HARDCODED_USERS = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    email: "ngo@bluecarbon-registry.org",
    password: "password123",
    name: "Sundarbans NGO",
    role: "ngo",
    organization_name: "Sundarbans Conservation Society",
    contact_number: "+91-9876543210",
    location: "Sundarbans Delta",
    is_approved: true
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    email: "community@bluecarbon-registry.org",
    password: "password123",
    name: "Coastal Panchayat",
    role: "community",
    organization_name: "Kundapura Coastal Council",
    contact_number: "+91-9876543211",
    location: "Kundapura Coast",
    is_approved: true
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    email: "auditor@bluecarbon-registry.org",
    password: "password123",
    name: "Green MRV Auditor",
    role: "auditor",
    is_approved: true
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    email: "admin@bluecarbon-registry.org",
    password: "password123",
    name: "BlueCarbon-Registry Admin",
    role: "admin",
    is_approved: true
  }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load session from local storage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('bluecarbon_token');
        if (token) {
          // Decode mock token (Base64 encoded profile JSON)
          const profileData = JSON.parse(atob(token.replace('mock_token_', '')));
          
          // Query the Supabase database to get the latest is_approved status and info
          const { data: dbUser, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', profileData.id)
            .single();

          if (!error && dbUser) {
            setUser({ id: dbUser.id, email: dbUser.email });
            setProfile(dbUser);
            // Update token with latest DB profile data
            localStorage.setItem('bluecarbon_token', 'mock_token_' + btoa(JSON.stringify(dbUser)));
          } else {
            // Use cached profile if database query fails (e.g. offline or table empty)
            setUser({ id: profileData.id, email: profileData.email });
            setProfile(profileData);
          }
        }
      } catch (err) {
        console.error('Failed to initialize mock auth session:', err);
        localStorage.removeItem('bluecarbon_token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Sign In handler (mocked)
  const signIn = async (email, password) => {
    try {
      // 1. Check local dynamic users in localStorage
      const dynamicUsers = JSON.parse(localStorage.getItem('bluecarbon_mock_users') || '[]');
      let matchedUser = HARDCODED_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!matchedUser) {
        matchedUser = dynamicUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      }

      if (!matchedUser || matchedUser.password !== password) {
        throw new Error('Invalid login credentials.');
      }

      // 2. Fetch the latest profile state from Supabase database
      const { data: dbUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', matchedUser.id)
        .single();

      let activeProfile = matchedUser;
      if (!error && dbUser) {
        activeProfile = dbUser;
      }

      // 3. Enforce approval check for NGOs and Community Members
      if (!activeProfile.is_approved && (activeProfile.role === 'ngo' || activeProfile.role === 'community')) {
        throw new Error('Your node registration is pending Administrator approval.');
      }

      // 4. Generate mock token (Prefix + base64 profile data)
      const token = 'mock_token_' + btoa(JSON.stringify(activeProfile));
      localStorage.setItem('bluecarbon_token', token);

      setUser({ id: activeProfile.id, email: activeProfile.email });
      setProfile(activeProfile);

      return { success: true, data: { user: activeProfile } };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign Up handler (mocked)
  const signUp = async (email, password, name, role, additionalMetadata = {}) => {
    try {
      const dynamicUsers = JSON.parse(localStorage.getItem('bluecarbon_mock_users') || '[]');
      const emailExists = HARDCODED_USERS.some(u => u.email.toLowerCase() === email.toLowerCase()) || 
                          dynamicUsers.some(u => u.email.toLowerCase() === email.toLowerCase());

      if (emailExists) {
        throw new Error('An account with this email address already exists.');
      }

      // Create unique ID for new registration
      const newUserId = 'user_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      const newUser = {
        id: newUserId,
        email,
        password,
        name,
        role,
        is_approved: role === 'admin' || role === 'auditor', // Auto-approve admin/auditor
        ...additionalMetadata
      };

      // 1. Save in dynamic users in localStorage
      dynamicUsers.push(newUser);
      localStorage.setItem('bluecarbon_mock_users', JSON.stringify(dynamicUsers));

      // 2. Insert user profile into public.users in Supabase database
      const { error: dbErr } = await supabase
        .from('users')
        .insert({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          organization_name: newUser.organization_name || null,
          contact_number: newUser.contact_number || null,
          location: newUser.location || null,
          is_approved: newUser.is_approved
        });

      if (dbErr) {
        console.error('Failed to sync registered profile to Supabase database:', dbErr);
      }

      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign Out handler
  const signOut = async () => {
    try {
      localStorage.removeItem('bluecarbon_token');
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile: async () => {
      if (user) {
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (dbUser) {
          setProfile(dbUser);
          localStorage.setItem('bluecarbon_token', 'mock_token_' + btoa(JSON.stringify(dbUser)));
        }
      }
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}

