import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Edit, Trash2, Building, Calendar, Loader2, Clock, MapPin, ExternalLink, Briefcase } from 'lucide-react';

const WorkTimeline = ({ userId, onEdit, onDelete, compact = false }) => {
    const [works, setWorks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null);
    const [endDateLoading, setEndDateLoading] = useState(null);

    useEffect(() => {
        fetchWorks();
    }, [userId]);

    const fetchWorks = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/work', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch work experience');
            }

            const data = await response.json();
            // Sort by start date, current positions first
            const sortedData = data.sort((a, b) => {
                if (a.isCurrent && !b.isCurrent) return -1;
                if (!a.isCurrent && b.isCurrent) return 1;
                return new Date(b.startDate) - new Date(a.startDate);
            });
            setWorks(sortedData);
        } catch (error) {
            console.error('Error fetching work experience:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (work) => {
        if (!window.confirm(`Are you sure you want to delete the work experience at ${work.companyName}?`)) {
            return;
        }

        setDeleteLoading(work.id);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/work/${work.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete work experience');
            }

            // Remove the work from the local state
            setWorks(works.filter(w => w.id !== work.id));

            // Call the parent's onDelete if provided
            if (onDelete) {
                onDelete({ type: 'work', data: work });
            }
        } catch (error) {
            console.error('Error deleting work experience:', error);
            alert('Failed to delete work experience: ' + error.message);
        } finally {
            setDeleteLoading(null);
        }
    };

    const handleSetEndDate = async (work) => {
        const today = new Date().toISOString().split('T')[0];

        setEndDateLoading(work.id);
        try {
            const token = localStorage.getItem('token');
            const updatedWork = {
                ...work,
                endDate: today,
                isCurrent: false
            };

            const response = await fetch(`http://localhost:8080/api/work/${work.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedWork)
            });

            if (!response.ok) {
                throw new Error('Failed to update work experience');
            }

            const data = await response.json();

            // Update the work in the local state
            setWorks(works.map(w => w.id === work.id ? data : w));
        } catch (error) {
            console.error('Error updating work experience:', error);
            alert('Failed to update work experience: ' + error.message);
        } finally {
            setEndDateLoading(null);
        }
    };

    const formatDuration = (startDate, endDate, isCurrent) => {
        const start = new Date(startDate);
        const end = isCurrent ? new Date() : new Date(endDate);
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;

        if (years === 0) return `${remainingMonths} mo${remainingMonths !== 1 ? 's' : ''}`;
        if (remainingMonths === 0) return `${years} yr${years !== 1 ? 's' : ''}`;
        return `${years} yr${years !== 1 ? 's' : ''} ${remainingMonths} mo${remainingMonths !== 1 ? 's' : ''}`;
    };

    const getCompanyInitials = (companyName) => {
        return companyName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    };

    if (loading) {
        return (
            <div className={compact ? 'p-4 flex items-center justify-center text-sm text-slate-500' : 'rounded-2xl border border-teal-900/10 dark:border-slate-700/60 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-900/60 dark:to-slate-900/50 backdrop-blur-xl shadow-md p-8'}>
                <div className="flex items-center justify-center">
                    <Loader2 className={`animate-spin ${compact ? 'h-5 w-5' : 'h-8 w-8'} text-sky-400`} />
                    <span className="ml-3 text-slate-600 dark:text-slate-300">Loading work experience...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={compact ? 'p-4 text-center text-red-500 dark:text-red-400 text-sm' : 'rounded-2xl border border-teal-900/10 dark:border-slate-700/60 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-900/60 dark:to-slate-900/50 backdrop-blur-xl shadow-md p-8'}>
                <div className="text-center text-red-500 dark:text-red-400">
                    <p>Error loading work experience: {error}</p>
                </div>
            </div>
        );
    }

    if (works.length === 0) {
        return (
            <div className={compact ? 'p-4 text-center text-slate-500 dark:text-slate-400 text-sm' : 'rounded-2xl border border-teal-900/10 dark:border-slate-700/60 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-900/60 dark:to-slate-900/50 backdrop-blur-xl shadow-md p-12'}>
                <div className="text-center">
                    {!compact && (
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-gradient-to-br from-sky-300 to-sky-400 dark:from-sky-400 dark:to-sky-500 text-white shadow">
                            <Briefcase className="h-8 w-8" />
                        </div>
                    )}
                    <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-lg'} text-slate-800 dark:text-slate-100 mb-1`}>No Work Experience</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-xs">Add your first role to showcase experience.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-${compact ? '3' : '4'}`}>
            {works.map((work, index) => (
                <div key={work.id} className="group relative">
                    {/* Timeline connector */}
                    {index < works.length - 1 && !compact && (
                        <div className="absolute left-8 top-20 w-0.5 h-6 bg-gradient-to-b from-sky-300 to-sky-400 dark:from-sky-400 dark:to-sky-500"></div>
                    )}

                    <div className={`${compact ? 'rounded-xl p-4 bg-white/60 dark:bg-slate-800/50 border border-white/50 dark:border-slate-700/50' : 'rounded-2xl border border-teal-900/10 dark:border-slate-700/60 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-900/60 dark:to-slate-900/50 backdrop-blur-xl shadow-md hover:shadow-lg'} transition-all duration-300 ${compact ? '' : 'p-6'}`}>
                        <div className="flex gap-4">
                            {/* Company Logo/Initial */}
                            <div className="shrink-0">
                                <div className={`${compact ? 'w-12 h-12 text-sm rounded-lg' : 'w-16 h-16 rounded-xl text-lg'} bg-gradient-to-br from-sky-300 to-sky-400 dark:from-sky-400 dark:to-sky-500 flex items-center justify-center text-white font-bold shadow-sm ring-1 ring-white/40 dark:ring-white/10`}>
                                    {getCompanyInitials(work.companyName)}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className={`flex items-start justify-between ${compact ? 'mb-2' : 'mb-3'}`}>
                                    <div className="flex-1">
                                        <h3 className={`${compact ? 'text-sm' : 'text-lg'} font-semibold text-slate-800 dark:text-slate-100 leading-tight`}>
                                            {work.position}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className={`${compact ? 'text-sm' : 'text-base'} font-medium text-slate-700 dark:text-slate-200`}>
                                                {work.companyName}
                                            </p>
                                            {work.isCurrent && (
                                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300 rounded-full px-2 py-0.5 text-[10px] font-medium">
                                                    Current
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {work.isCurrent && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleSetEndDate(work)}
                                                disabled={endDateLoading === work.id}
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                                                title="Set end date to today"
                                            >
                                                {endDateLoading === work.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Clock className="h-4 w-4" />
                                                )}
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit && onEdit({ type: 'work', data: work })}
                                            className="h-8 w-8 p-0 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-500/10"
                                            title="Edit work experience"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(work)}
                                            disabled={deleteLoading === work.id}
                                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                                            title="Delete work experience"
                                        >
                                            {deleteLoading === work.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Date and Duration */}
                                <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 ${compact ? 'text-xs mb-2' : 'text-sm mb-3'} text-slate-500 dark:text-slate-400`}>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>{work.displayDateRange}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span>{formatDuration(work.startDate, work.endDate, work.isCurrent)}</span>
                                    </div>
                                </div>

                                {/* Description if available */}
                                {work.description && (
                                    <p className={`${compact ? 'text-xs line-clamp-2' : 'text-sm'} text-slate-600 dark:text-slate-300 leading-relaxed mb-2`}>{work.description}</p>
                                )}

                                {/* Location if available */}
                                {work.location && (
                                    <div className={`flex items-center gap-1 ${compact ? 'text-xs' : 'text-sm'} text-slate-500 dark:text-slate-400`}>
                                        <MapPin className="h-4 w-4" />
                                        <span>{work.location}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default WorkTimeline; 