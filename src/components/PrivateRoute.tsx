import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!currentUser) {
        setHasAccess(false);
        return;
      }

      try {
        const teamQuery = query(
          collection(db, 'teamMembers'),
          where('userId', '==', currentUser.uid)
        );
        const snapshot = await getDocs(teamQuery);
        
        if (!snapshot.empty) {
          const teamMember = snapshot.docs[0].data();
          setHasAccess(teamMember.status === 'active');
        } else {
          setHasAccess(true); // User is an owner
        }
      } catch (error) {
        console.error('Error checking access:', error);
        setHasAccess(false);
      }
    };

    checkAccess();
  }, [currentUser]);

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return hasAccess ? <>{children}</> : <Navigate to="/login" />;
};

export default PrivateRoute;