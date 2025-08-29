import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';


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
            const token = localStorage.getItem('token'); // or sessionStorage.getItem('token')
            const response = await fetch(`http://localhost:8080/api/education/summary`, {
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
        } finally {
            setLoading(false);
        }
    };

    const getInstitutionColor = (institutionName) => {
        // Generate consistent colors for institutions using sky theme
        const colors = [
            'bg-sky-400', 'bg-sky-500', 'bg-sky-600'
        ];
        const index = institutionName.length % colors.length;
        return colors[index];
    };

    const getLevelColor = (level, isCompleted = true) => {
        if (!isCompleted) return 'bg-slate-300/60 dark:bg-slate-600/40';
        return 'bg-gradient-to-br from-sky-300 to-sky-400 dark:from-sky-400 dark:to-sky-500';
    };

    const openInstitutionModal = (institution) => {
        setSelectedInstitution(institution);
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <Card className="w-full rounded-2xl border border-teal-900/10 dark:border-slate-700/60 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-900/60 dark:to-slate-900/50 backdrop-blur-xl shadow-md">
                <CardHeader>
                    <CardTitle className="text-slate-800 dark:text-slate-100">Education Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!educationData) {
        return (
            <Card className="w-full rounded-2xl border border-teal-900/10 dark:border-slate-700/60 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-900/60 dark:to-slate-900/50 backdrop-blur-xl shadow-md">
                <CardHeader>
                    <CardTitle className="text-slate-800 dark:text-slate-100">Education Timeline</CardTitle>
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
            <Card className="w-full rounded-2xl border border-teal-900/10 dark:border-slate-700/60 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-900/60 dark:to-slate-900/50 backdrop-blur-xl shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        🎓 Education Journey
                        <Badge variant="secondary" className="bg-slate-100/80 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700">
                            {educationData.schools?.length || 0} Schools • {educationData.universities?.length || 0} Semesters
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        {/* School Education Timeline */}
                        {Object.entries(schoolsByInstitution).map(([institutionName, schools]) => (
                            <div key={institutionName} className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full ${getInstitutionColor(institutionName)}`}></div>
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{institutionName}</h3>
                                    <Badge variant="outline" className="ml-auto border-sky-300 dark:border-sky-600 text-sky-600 dark:text-sky-400">
                                        School
                                    </Badge>
                                </div>

                                <div className="flex flex-wrap gap-3 ml-7">
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const school = schools.find(s => s.classLevel === i + 1);
                                        const isCompleted = !!school;

                                        return (
                                            <Button
                                                key={i + 1}
                                                variant={isCompleted ? "default" : "outline"}
                                                size="sm"
                                                className={`w-12 h-12 rounded-full p-0 ${getLevelColor(i + 1, isCompleted)} hover:scale-110 transition-transform relative border-0 text-white`}
                                                onClick={() => isCompleted && openInstitutionModal({ type: 'school', data: school, institutionName })}
                                                disabled={!isCompleted}
                                            >
                                                <span className="text-xs font-bold">
                                                    {school?.classLevel === 10 ? 'SSC' : school?.classLevel === 12 ? 'HSC' : school?.classLevel}
                                                </span>
                                                {isCompleted && (
                                                    <div className="absolute -top-1 -right-1 flex gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onEdit({ type: 'school', data: school, institutionName });
                                                            }}
                                                            className="w-4 h-4 bg-teal-500 hover:bg-teal-600 rounded-full flex items-center justify-center text-white text-xs"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDelete({ type: 'school', data: school, institutionName });
                                                            }}
                                                            className="w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                )}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* University Education Timeline */}
                        {Object.entries(universitiesByInstitution).map(([institutionName, universities]) => (
                            <div key={institutionName} className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full ${getInstitutionColor(institutionName)}`}></div>
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{institutionName}</h3>
                                    <Badge variant="outline" className="ml-auto border-sky-300 dark:border-sky-600 text-sky-600 dark:text-sky-400">
                                        University
                                    </Badge>
                                </div>

                                <div className="flex flex-wrap gap-3 ml-7">
                                    {Array.from({ length: 8 }, (_, i) => {
                                        const university = universities.find(u => u.semesterNumber === i + 1);
                                        const isCompleted = !!university;

                                        return (
                                            <Button
                                                key={i + 1}
                                                variant={isCompleted ? "default" : "outline"}
                                                size="sm"
                                                className={`w-12 h-12 rounded-full p-0 ${getLevelColor(i + 13, isCompleted)} hover:scale-110 transition-transform relative border-0 text-white`}
                                                onClick={() => isCompleted && openInstitutionModal({ type: 'university', data: university, institutionName })}
                                                disabled={!isCompleted}
                                            >
                                                <span className="text-xs font-bold">
                                                    {i + 1}
                                                </span>
                                                {isCompleted && (
                                                    <div className="absolute -top-1 -right-1 flex gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onEdit({ type: 'university', data: university, institutionName });
                                                            }}
                                                            className="w-4 h-4 bg-teal-500 hover:bg-teal-600 rounded-full flex items-center justify-center text-white text-xs"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDelete({ type: 'university', data: university, institutionName });
                                                            }}
                                                            className="w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                )}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Institution Details Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md rounded-2xl border border-teal-900/10 dark:border-slate-700/60 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-900/60 dark:to-slate-900/50 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                            {selectedInstitution?.type === 'school' ? '🏫' : '🎓'}
                            {selectedInstitution?.institutionName}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedInstitution?.type === 'school' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Class Level</label>
                                    <p className="text-lg font-semibold text-slate-800">{selectedInstitution.data.displayName}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Result</label>
                                    <p className="text-lg font-semibold text-emerald-600">{selectedInstitution.data.result}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Academic Year</label>
                                    <p className="text-lg text-slate-800">{selectedInstitution.data.academicYear}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Completion Date</label>
                                    <p className="text-lg text-slate-800">{selectedInstitution.data.completionDate}</p>
                                </div>
                            </div>

                            {selectedInstitution.data.certificateUrl && (
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Certificate</label>
                                    <a
                                        href={selectedInstitution.data.certificateUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sky-600 hover:underline"
                                    >
                                        View Certificate
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {selectedInstitution?.type === 'university' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Semester</label>
                                    <p className="text-lg font-semibold text-slate-800">{selectedInstitution.data.semesterDisplayName}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Result</label>
                                    <p className="text-lg font-semibold text-emerald-600">{selectedInstitution.data.semesterResult}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Degree</label>
                                    <p className="text-lg text-slate-800">{selectedInstitution.data.degreeName}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Academic Year</label>
                                    <p className="text-lg text-slate-800">{selectedInstitution.data.academicYear}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Credits</label>
                                    <p className="text-lg text-slate-800">{selectedInstitution.data.totalCredits}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Status</label>
                                    <Badge variant={selectedInstitution.data.isCompleted ? "default" : "secondary"}>
                                        {selectedInstitution.data.isCompleted ? "Completed" : "In Progress"}
                                    </Badge>
                                </div>
                            </div>

                            {selectedInstitution.data.transcriptUrl && (
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Transcript</label>
                                    <a
                                        href={selectedInstitution.data.transcriptUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sky-600 hover:underline"
                                    >
                                        View Transcript
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