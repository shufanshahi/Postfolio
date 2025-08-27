import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Edit, Trash2, Building, MapPin, Calendar, Briefcase, Code, Award, Loader2 } from 'lucide-react';

const WorkTimeline = ({ userId, onEdit, onDelete }) => {
    const [works, setWorks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                                    {work.location && (
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            <span>{work.location}</span>
                                        </div>
                                    )}
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
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEdit && onEdit({ type: 'work', data: work })}
                                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDelete && onDelete({ type: 'work', data: work })}
                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                        {work.description && (
                            <div>
                                <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                    <Briefcase className="h-4 w-4" />
                                    Job Description
                                </h4>
                                <p className="text-slate-600 text-sm leading-relaxed">{work.description}</p>
                            </div>
                        )}
                        
                        {work.achievements && (
                            <div>
                                <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                    <Award className="h-4 w-4" />
                                    Key Achievements
                                </h4>
                                <div className="text-slate-600 text-sm">
                                    {work.achievements.split(',').map((achievement, idx) => (
                                        <div key={idx} className="flex items-start gap-2 mb-1">
                                            <span className="text-sky-500 mt-1">•</span>
                                            <span>{achievement.trim()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {work.technologiesUsed && (
                            <div>
                                <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                    <Code className="h-4 w-4" />
                                    Technologies Used
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {work.technologiesUsed.split(',').map((tech, idx) => (
                                        <Badge
                                            key={idx}
                                            variant="outline"
                                            className="text-xs bg-slate-100 text-slate-700 border-slate-200"
                                        >
                                            {tech.trim()}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="text-xs text-slate-500">
                            Duration: {work.duration}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default WorkTimeline; 