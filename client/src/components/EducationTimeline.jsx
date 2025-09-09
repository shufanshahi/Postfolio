import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Loader2, GraduationCap, School, Edit2, Trash2 } from 'lucide-react';

// Theme tokens aligned with dashboard
const gradientPanel = 'bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm';
const subtleCard = 'bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors';


const EducationTimeline = ({ userId, onEdit, onDelete }) => {
    const [educationData, setEducationData] = useState(null);
    const [selectedInstitution, setSelectedInstitution] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEducationData();
    }, [userId]);

    const fetchEducationData = async () => {
        try {
            const token = localStorage.getItem('token');

            // Use the new public endpoint if userId is provided
            let url;
            if (userId) {
                url = `http://localhost:8080/api/education/summary/${userId}`;
            } else {
                url = `http://localhost:8080/api/education/summary`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            setEducationData(data);
        } catch (error) {
            console.error('Error fetching education data:', error);
            setEducationData(null);
        } finally {
            setLoading(false);
        }
    };

    const getInstitutionColor = (institutionName) => {
        // Soft teal/indigo palette from dashboard
        const palettes = [
            'from-teal-300 to-teal-400',
            'from-indigo-300 to-indigo-400',
            'from-amber-300 to-amber-400'
        ];
        const index = institutionName.length % palettes.length;
        return palettes[index];
    };

    const getLevelColor = (level, isCompleted = true) => {
        if (!isCompleted) return 'bg-slate-200/70 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400';
        return 'bg-gradient-to-br from-teal-400 to-indigo-400 dark:from-teal-500 dark:to-indigo-500 text-white shadow-sm';
    };

    const openInstitutionModal = (institution) => {
        setSelectedInstitution(institution);
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <Card className={`w-full rounded-2xl ${gradientPanel}`}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        <GraduationCap className="h-5 w-5 text-teal-600 dark:text-teal-400" /> Education Timeline
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-teal-600 dark:text-teal-300" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!educationData) {
        return (
            <Card className={`w-full rounded-2xl ${gradientPanel}`}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        <GraduationCap className="h-5 w-5 text-teal-600 dark:text-teal-400" /> Education Timeline
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-600 dark:text-slate-400">No education data available</p>
                </CardContent>
            </Card>
        );
    }

    // Group schools by institution
    const schoolsByInstitution = {};
    educationData.schools?.forEach(school => {
        if (!schoolsByInstitution[school.schoolName]) {
            schoolsByInstitution[school.schoolName] = [];
        }
        schoolsByInstitution[school.schoolName].push(school);
    });

    // Group universities by institution
    const universitiesByInstitution = {};
    educationData.universities?.forEach(university => {
        if (!universitiesByInstitution[university.universityName]) {
            universitiesByInstitution[university.universityName] = [];
        }
        universitiesByInstitution[university.universityName].push(university);
    });

    return (
        <div className="space-y-6">
            <Card className={`w-full rounded-2xl relative overflow-hidden ${gradientPanel}`}>
                <CardHeader>
                    <CardTitle className="flex flex-wrap items-center gap-3 text-slate-800 dark:text-slate-100 text-lg font-semibold">
                        <GraduationCap className="h-5 w-5 text-teal-600 dark:text-teal-400" /> Education Journey
                        <Badge variant="secondary" className="bg-slate-100/80 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 ring-1 ring-inset ring-white/40 dark:ring-slate-600/40">
                            {educationData.schools?.length || 0} Schools · {educationData.universities?.reduce((total, uni) => total + (uni.semesterCount || 0), 0) || 0} Semesters
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        {/* School Education Timeline */}
                        {Object.entries(schoolsByInstitution).map(([institutionName, schools]) => (
                            <div key={institutionName} className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${getInstitutionColor(institutionName)} flex items-center justify-center text-white shadow-sm ring-1 ring-white/50 dark:ring-white/10`}>
                                        <School className="h-4 w-4" />
                                    </div>
                                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 tracking-wide">{institutionName}</h3>
                                    <Badge variant="outline" className="ml-auto border-teal-300 dark:border-teal-600 text-teal-600 dark:text-teal-400 bg-white/60 dark:bg-slate-800/50 backdrop-blur">
                                        School
                                    </Badge>
                                </div>

                                <div className="flex flex-wrap gap-3 ml-10">
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const school = schools.find(s => s.classLevel === i + 1);
                                        const isCompleted = !!school;

                                        return (
                                            <div
                                                key={i + 1}
                                                onClick={() => isCompleted && openInstitutionModal({ type: 'school', data: school, institutionName })}
                                                className={`group relative w-12 h-12 rounded-xl flex items-center justify-center text-[11px] font-semibold tracking-wide select-none cursor-pointer ring-1 ring-inset ${getLevelColor(i + 1, isCompleted)} transition-all duration-200 hover:-translate-y-0.5 ${isCompleted ? 'hover:shadow-md' : 'opacity-50 cursor-default'}`}
                                            >
                                                {school?.classLevel === 10 ? 'SSC' : school?.classLevel === 12 ? 'HSC' : school?.classLevel}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* University Education Timeline */}
                        {Object.entries(universitiesByInstitution).map(([institutionName, universities]) => (
                            <div key={institutionName} className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${getInstitutionColor(institutionName)} flex items-center justify-center text-white shadow-sm ring-1 ring-white/50 dark:ring-white/10`}>
                                        <GraduationCap className="h-4 w-4" />
                                    </div>
                                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 tracking-wide">{institutionName}</h3>
                                    <Badge variant="outline" className="ml-auto border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white/60 dark:bg-slate-800/50 backdrop-blur">
                                        University
                                    </Badge>
                                </div>

                                {universities.map((university, index) => (
                                    <div key={university.id || index} className="ml-10">
                                        <div className="mb-2">
                                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">{university.degreeName}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    CGPA: {university.cgpa ? university.cgpa.toFixed(2) : 'N/A'}
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    ({university.completedSemestersCount || 0}/{university.semesterCount || 0} semesters)
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2">
                                            {Array.from({ length: university.semesterCount || 0 }, (_, i) => {
                                                const semesterGpa = university.semesterResults?.[i];
                                                const isCompleted = semesterGpa != null && semesterGpa > 0;

                                                return (
                                                    <div
                                                        key={i + 1}
                                                        onClick={() => isCompleted && openInstitutionModal({ 
                                                            type: 'university', 
                                                            data: { 
                                                                ...university, 
                                                                semesterNumber: i + 1, 
                                                                semesterResult: semesterGpa?.toString() || 'N/A',
                                                                degreeName: university.degreeName
                                                            }, 
                                                            institutionName 
                                                        })}
                                                        className={`group relative w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-semibold tracking-wide select-none cursor-pointer ring-1 ring-inset ${getLevelColor(i + 1, isCompleted)} transition-all duration-200 hover:-translate-y-0.5 ${isCompleted ? 'hover:shadow-md' : 'opacity-50 cursor-default'}`}
                                                    >
                                                        {i + 1}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Institution Details Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md bg-[oklch(0.985_0.015_95)] dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedInstitution?.type === 'school' ? <School className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
                            {selectedInstitution?.institutionName}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedInstitution?.type === 'school' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <label className="text-xs font-medium text-slate-600 uppercase">Class Level</label>
                                    <p className="mt-0.5 font-semibold">{selectedInstitution.data.displayName}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600 uppercase">Result</label>
                                    <p className="mt-0.5 font-semibold text-emerald-600">{selectedInstitution.data.result}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600 uppercase">Academic Year</label>
                                    <p className="mt-0.5">{selectedInstitution.data.academicYear}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600 uppercase">Completion Date</label>
                                    <p className="mt-0.5">{selectedInstitution.data.completionDate}</p>
                                </div>
                            </div>

                            {selectedInstitution.data.certificateUrl && (
                                <div>
                                    <label className="text-xs font-medium text-slate-600 uppercase">Certificate</label>
                                    <a href={selectedInstitution.data.certificateUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-blue-600 hover:underline text-sm font-medium">
                                        View Certificate ↗
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {selectedInstitution?.type === 'university' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <label className="text-xs font-medium text-slate-600 uppercase">Semester</label>
                                    <p className="mt-0.5 font-semibold">Semester {selectedInstitution.data.semesterNumber}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600 uppercase">GPA</label>
                                    <p className="mt-0.5 font-semibold text-emerald-600">{selectedInstitution.data.semesterResult}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600 uppercase">Degree</label>
                                    <p className="mt-0.5">{selectedInstitution.data.degreeName}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600 uppercase">CGPA</label>
                                    <p className="mt-0.5 font-semibold text-indigo-600">{selectedInstitution.data.cgpa ? selectedInstitution.data.cgpa.toFixed(2) : 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600 uppercase">Progress</label>
                                    <p className="mt-0.5">{selectedInstitution.data.completedSemestersCount || 0}/{selectedInstitution.data.semesterCount || 0} semesters</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600 uppercase">Status</label>
                                    <div className="mt-0.5">
                                        <Badge variant={selectedInstitution.data.isDegreeCompleted ? "default" : "secondary"}>
                                            {selectedInstitution.data.isDegreeCompleted ? "Completed" : "In Progress"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {selectedInstitution.data.transcriptUrl && (
                                <div>
                                    <label className="text-xs font-medium text-slate-600 uppercase">Transcript</label>
                                    <a href={selectedInstitution.data.transcriptUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-blue-600 hover:underline text-sm font-medium">
                                        View Transcript ↗
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EducationTimeline;