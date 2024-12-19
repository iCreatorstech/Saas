import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { CheckCircle } from 'lucide-react';

const OnboardingSuccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Onboarding Successful!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Your onboarding process was successful. Thank you for doing business with us.
        </p>
        <div className="space-y-4">
          <Button
            onClick={() => navigate('/onboarding')}
            className="w-full"
          >
            Go to Onboarding
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSuccess;