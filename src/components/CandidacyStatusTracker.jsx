import React, { useEffect, useState } from 'react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/solid';

function CandidacyStatusTracker() {
  const { user } = useAuth();
  const [currentStatus, setCurrentStatus] = useState(null);
  const [appointmentStatus, setAppointmentStatus] = useState(null);
  const [currentStep, setCurrentStep] = useState(-1);

  useEffect(() => {
    const fetchCandidacy = async () => {
      if (!user) return;

      try {
        const appsRef = dbRef(db, `candidacyApplications/${user.uid}`);
        const snap = await get(appsRef);
        if (!snap.exists()) {
          setCurrentStatus(null);
          return;
        }

        const apps = Object.values(snap.val());
        const latest = apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        const status = latest?.status || 'none';
        const appointment = latest?.appointment?.status || null;

        setCurrentStatus(status);
        setAppointmentStatus(appointment);

        let step = -1;
        if (status === 'submitted') step = 0;
        else if (status === 'reviewed' || status === 'rejected') step = 1;
        else if (appointment === 'pending') step = 2;
        else if (appointment === 'approved' || appointment === 'rejected') step = 3;
        if (status === 'approved' || status === 'rejected_final') step = 4;

        setCurrentStep(step);
      } catch (error) {
        console.error('Error fetching candidacy data', error);
      }
    };

    fetchCandidacy();
  }, [user]);

  const steps = [
  { key: 'submitted', label: 'Submitted Candidacy' },
    {
      key: 'reviewed',
      label:
        (currentStatus === 'passed' || currentStatus === 'failed')
          ? 'Reviewed Candidacy' // ✅ when final result exists, lock it to "Reviewed"
          : currentStatus === 'rejected'
          ? 'Rejected Candidacy'
          : currentStatus === 'reviewed'
          ? 'Reviewed Candidacy'
          : 'Reviewed / Rejected Candidacy',
    },
    { key: 'screening', label: 'Screening Appointment' },
    {
      key: 'screeningResult',
      label:
        appointmentStatus === 'rejected'
          ? 'Rejected Screening'
          : appointmentStatus === 'approved'
          ? 'Approved Screening'
          : 'Approved / Rejected Screening',
    },
    {
      key: 'final',
      label:
        currentStatus === 'failed'
          ? 'Unqualified Candidate'
          : currentStatus === 'passed'
          ? 'Qualified Candidate'
          : 'Qualified / Unqualified Candidate',
    },
  ];

  const getIcon = (index) => {
    if (index === 0) {
      if (['submitted', 'reviewed', 'rejected', 'passed', 'failed'].includes(currentStatus))
        return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
    }
    if (index === 1) {
      if (currentStatus === 'reviewed') return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      if (currentStatus === 'submitted') return <ClockIcon className="w-6 h-6 text-yellow-600" />;
      if (currentStatus === 'rejected') return <XCircleIcon className="w-6 h-6 text-red-600" />;
      if (['passed', 'failed'].includes(currentStatus)) return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
    }
    if (index === 2) {
      if (['approved', 'rejected', 'pending'].includes(appointmentStatus))
        return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      if (currentStatus === 'rejected') return <XCircleIcon className="w-6 h-6 text-red-600" />;
    }
    if (index === 3) {
      if (appointmentStatus === 'approved') return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      if (appointmentStatus === 'rejected') return <XCircleIcon className="w-6 h-6 text-red-600" />;
      if (appointmentStatus === 'pending') return <ClockIcon className="w-6 h-6 text-yellow-600" />;
      if (currentStatus === 'rejected') return <XCircleIcon className="w-6 h-6 text-red-600" />;
    }
    if (index === 4) {
      if (currentStatus === 'passed') return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      if (currentStatus === 'failed') return <XCircleIcon className="w-6 h-6 text-red-600" />;
      if (appointmentStatus === 'approved') return <ClockIcon className="w-6 h-6 text-yellow-600" />;
      if (['rejected', 'rejected_final'].includes(currentStatus)) return <XCircleIcon className="w-6 h-6 text-red-600" />;
    }
    return <span className="text-gray-400 font-semibold">{index + 1}</span>;
  };

  const getCircleBg = (index) => {
    if (index === 1 && currentStatus === 'rejected') return 'bg-red-100';
    if (index === 1 && currentStatus === 'submitted') return 'bg-yellow-100';
    if (index === 2 && appointmentStatus === 'approved') return 'bg-green-100';
    if (index === 2 && ['rejected', 'pending'].includes(appointmentStatus)) return 'bg-green-100';
    if (index === 2 && currentStatus === 'rejected') return 'bg-red-100';
    if (index === 3 && appointmentStatus === 'approved') return 'bg-green-100';
    if (index === 3 && appointmentStatus === 'rejected') return 'bg-red-100';
    if (index === 3 && appointmentStatus === 'pending') return 'bg-yellow-100';
    if (index === 3 && currentStatus === 'rejected') return 'bg-red-100';
    if (index === 4 && currentStatus === 'failed') return 'bg-red-100';
    if (index === 4 && currentStatus === 'passed') return 'bg-green-100';
    if (index === 4 && appointmentStatus === 'approved') return 'bg-yellow-100';
    if (index === 4 && appointmentStatus === 'rejected') return 'bg-red-100';
    if (index === 4 && currentStatus === 'rejected') return 'bg-red-100';
    if (index <= currentStep) return 'bg-green-100';
    return 'bg-gray-200';
  };

  return (
    <div className="p-6 mb-6">
      <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-center text-gray-800">
        CANDIDACY APPLICATION STEPS
      </h3>

      {/* Responsiveness Fix: Icons stay aligned, labels adjust */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start w-full relative gap-y-6 sm:gap-y-0 sm:gap-x-6">
        {steps.map((step, index) => (
          <div
            key={step.key}
            className="relative flex flex-col items-center sm:flex-col sm:flex-1 text-center sm:text-center"
          >
            {/* Circle/Icon - Fixed position */}
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full z-10 transition-colors duration-300 ${getCircleBg(
                index
              )}`}
            >
              {getIcon(index)}
            </div>

            {/* Label - Responsive alignment */}
            <span
              className={`mt-3 sm:mt-2 text-xs sm:text-sm font-medium leading-tight text-center ${
                index <= currentStep ? 'text-green-700' : 'text-gray-600'
              } 
              ${index === 1 && currentStatus === 'submitted' ? 'text-yellow-700' : ''}
              ${index === 1 && currentStatus === 'rejected' ? 'text-red-700' : ''}
              ${index === 2 && appointmentStatus === 'pending' ? 'text-green-700' : ''}
              ${index === 2 && appointmentStatus === 'approved' ? 'text-green-700' : ''} 
              ${index === 2 && appointmentStatus === 'rejected' ? 'text-green-700' : ''} 
              ${index === 2 && currentStatus === 'rejected' ? 'text-red-700' : ''} 
              ${index === 3 && appointmentStatus === 'approved' ? 'text-green-700' : ''} 
              ${index === 3 && appointmentStatus === 'rejected' ? 'text-red-700' : ''} 
              ${index === 3 && appointmentStatus === 'pending' ? 'text-yellow-700' : ''} 
              ${index === 3 && currentStatus === 'rejected' ? 'text-red-700' : ''} 
              ${index === 4 
                ? currentStatus === 'passed'
                  ? 'text-green-700'
                  : currentStatus === 'failed'
                    ? 'text-red-700'
                    : appointmentStatus === 'approved'
                      ? 'text-yellow-700'
                      : appointmentStatus === 'rejected'
                        ? 'text-red-700'
                        : currentStatus === 'rejected' // ✅ if step 1 is rejected, make this red too
                          ? 'text-red-700'
                          : ''
                : ''
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CandidacyStatusTracker;
