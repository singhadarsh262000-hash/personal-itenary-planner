import React from 'react';
import {
  MapPin,
  Utensils,
  Car,
  Home,
  Compass,
  Palette,
  Coffee,
  Moon,
  ShoppingBag,
  Trees,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { ActivityCategory, TripStatus } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'amber' | 'emerald' | 'cyan' | 'rose' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  };

  const variantStyles = {
    default: 'bg-slate-800 text-slate-300 border border-slate-700/60',
    amber: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30',
    rose: 'bg-rose-500/10 text-rose-300 border border-rose-500/30',
    purple: 'bg-purple-500/10 text-purple-300 border border-purple-500/30',
    slate: 'bg-slate-900 text-slate-400 border border-slate-800',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full tracking-wide select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

export const CategoryBadge: React.FC<{ category: ActivityCategory; size?: 'sm' | 'md' }> = ({
  category,
  size = 'sm',
}) => {
  switch (category) {
    case 'Sightseeing':
      return <Badge variant="cyan" size={size} icon={<MapPin className="w-3 h-3" />}>Sightseeing</Badge>;
    case 'Dining':
      return <Badge variant="amber" size={size} icon={<Utensils className="w-3 h-3" />}>Dining</Badge>;
    case 'Transportation':
      return <Badge variant="purple" size={size} icon={<Car className="w-3 h-3" />}>Transit</Badge>;
    case 'Accommodation':
      return <Badge variant="emerald" size={size} icon={<Home className="w-3 h-3" />}>Lodging</Badge>;
    case 'Activity':
      return <Badge variant="amber" size={size} icon={<Compass className="w-3 h-3" />}>Activity</Badge>;
    case 'Culture':
      return <Badge variant="cyan" size={size} icon={<Palette className="w-3 h-3" />}>Culture</Badge>;
    case 'Relaxation':
      return <Badge variant="emerald" size={size} icon={<Coffee className="w-3 h-3" />}>Relaxation</Badge>;
    case 'Nightlife':
      return <Badge variant="purple" size={size} icon={<Moon className="w-3 h-3" />}>Nightlife</Badge>;
    case 'Shopping':
      return <Badge variant="rose" size={size} icon={<ShoppingBag className="w-3 h-3" />}>Shopping</Badge>;
    case 'Nature':
      return <Badge variant="emerald" size={size} icon={<Trees className="w-3 h-3" />}>Nature</Badge>;
    default:
      return <Badge variant="slate" size={size}>Other</Badge>;
  }
};

export const StatusBadge: React.FC<{ status: TripStatus }> = ({ status }) => {
  switch (status) {
    case 'generated':
      return <Badge variant="emerald" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>Ready</Badge>;
    case 'generating':
      return <Badge variant="amber" size="sm" icon={<Sparkles className="w-3 h-3 animate-spin" />}>Generating...</Badge>;
    case 'failed':
      return <Badge variant="rose" size="sm" icon={<AlertCircle className="w-3 h-3" />}>Needs Generation</Badge>;
    case 'draft':
    default:
      return <Badge variant="slate" size="sm" icon={<Clock className="w-3 h-3" />}>Draft</Badge>;
  }
};
