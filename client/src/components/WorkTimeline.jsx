import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Edit, Trash2, Building, Calendar, Loader2, Clock } from 'lucide-react';

const WorkTimeline = ({ userId, onEdit, onDelete }) => {
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
            setWorks(data);
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

    if (loading) {
        return (
            <Card className="bg-slate-50/50 border-slate-200/50">
                <CardContent className="py-12">
                    <div className="flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                        <span className="ml-2 text-slate-600">Loading work experience...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="bg-slate-50/50 border-slate-200/50">
                <CardContent className="py-12">
                    <div className="text-center text-red-500">
                        <p>Error loading work experience: {error}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (works.length === 0) {
        return (
            <Card className="bg-slate-50/50 border-slate-200/50">
                <CardContent className="py-12">
                    <div className="text-center">
                        <Building className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No Work Experience</h3>
                        <p className="text-slate-600">Start building your professional journey by adding your work experience.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {works.map((work, index) => (
                <Card key={work.id} className="bg-white border-slate-200 hover:border-slate-300 transition-all duration-300 shadow-sm hover:shadow-md">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-purple-500 rounded-lg flex items-center justify-center">
                                        <Building className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800">{work.position}</h3>
                                        <p className="text-sky-600 font-medium">{work.companyName}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>{work.displayDateRange}</span>
                                    </div>
                                    {work.isCurrent && (
                                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                            Current
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {work.isCurrent && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSetEndDate(work)}
                                        disabled={endDateLoading === work.id}
                                        className="text-slate-400 hover:text-orange-600 hover:bg-orange-50"
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
                                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                    title="Edit work experience"
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(work)}
                                    disabled={deleteLoading === work.id}
                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50"
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
                    </CardHeader>
                </Card>
            ))}
        </div>
    );
};

export default WorkTimeline; 