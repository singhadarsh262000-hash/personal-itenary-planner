import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateTripInput } from '../types';
import { api, ApiException } from '../services/api';
import { TripBuilderForm } from '../components/trip-builder/TripBuilderForm';
import { GeneratingModal } from '../components/trip-builder/GeneratingModal';
import { useToast } from '../components/ui/Toast';

export const TripBuilderPage: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDestination, setCurrentDestination] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const handleCreateAndGenerate = async (formData: CreateTripInput) => {
    setCurrentDestination(formData.destination);
    setIsGenerating(true);

    try {
      // 1. Create trip record on backend
      const createdTrip = await api.createTrip(formData);

      try {
        // 2. Generate itinerary with Gemini AI
        await api.generateItinerary(createdTrip.id);
        toast.success(`Itinerary for ${createdTrip.destination} generated successfully!`);
        navigate(`/trips/${createdTrip.id}`);
      } catch (genErr: any) {
        // If Gemini is unconfigured or failed, still save draft and navigate with warning
        const isConfigErr = genErr?.code === 'AI_CONFIG_ERROR';
        if (isConfigErr) {
          toast.info(
            'Trip saved! However, GEMINI_API_KEY is not configured in backend/.env. You can view the trip and generate it after adding your key.'
          );
        } else {
          toast.error(
            genErr?.message || 'Itinerary generation encountered an issue. You can retry from the trip page.'
          );
        }
        navigate(`/trips/${createdTrip.id}`);
      }
    } catch (err: any) {
      const msg = err instanceof ApiException ? err.message : 'Failed to create trip.';
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center max-w-xl mx-auto">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Design Your Travel Itinerary
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
          Tell us about your trip destination, dates, budget, and travel style. Our AI will craft an optimized, day-by-day plan with timings and budget estimates.
        </p>
      </div>

      <TripBuilderForm onSubmit={handleCreateAndGenerate} isLoading={isGenerating} />

      <GeneratingModal isOpen={isGenerating} destination={currentDestination} />
    </div>
  );
};
