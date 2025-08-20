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
        // Generate consistent colors for institutions
        const colors = [
            'bg-sky-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
            'bg-rose-500', 'bg-indigo-500', 'bg-teal-500', 'bg-red-500'
        ];
        const index = institutionName.length % colors.length;
        return colors[index];
    };

    const getLevelColor = (level, isCompleted = true) => {
        if (!isCompleted) return 'bg-slate-300';

        if (level <= 5) return 'bg-emerald-400';
        if (level <= 10) return 'bg-sky-400';
        if (level <= 12) return 'bg-purple-400';
        if (level <= 16) return 'bg-amber-400';
        return 'bg-red-400';
    };

    const openInstitutionModal = (institution) => {
        setSelectedInstitution(institution);
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <Card className="w-full bg-white border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-slate-800">Education Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!educationData) {
        return (
            <Card className="w-full bg-white border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-slate-800">Education Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-600">No education data available</p>
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
            <Card className="w-full bg-white border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                        🎓 Education Journey
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">
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
                                    <h3 className="text-lg font-semibold text-slate-800">{institutionName}</h3>
                                    <Badge variant="outline" className="ml-auto border-slate-300 text-slate-600">
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
                                                className={`w-12 h-12 rounded-full p-0 ${getLevelColor(i + 1, isCompleted)} hover:scale-110 transition-transform relative`}
                                                onClick={() => isCompleted && openInstitutionModal({ type: 'school', data: school, institutionName })}
                                                disabled={!isCompleted}
                                            >
                                                <span className="text-xs font-bold text-white">
                                                    {school?.classLevel === 10 ? 'SSC' : school?.classLevel === 12 ? 'HSC' : school?.classLevel}
                                                </span>
                                                {isCompleted && (
                                                    <div className="absolute -top-1 -right-1 flex gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onEdit({ type: 'school', data: school, institutionName });
                                                            }}
                                                            className="w-4 h-4 bg-sky-500 hover:bg-sky-600 rounded-full flex items-center justify-center text-white text-xs"
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
                                    <h3 className="text-lg font-semibold text-slate-800">{institutionName}</h3>
                                    <Badge variant="outline" className="ml-auto border-slate-300 text-slate-600">
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
                                                className={`w-12 h-12 rounded-full p-0 ${getLevelColor(i + 13, isCompleted)} hover:scale-110 transition-transform relative`}
                                                onClick={() => isCompleted && openInstitutionModal({ type: 'university', data: university, institutionName })}
                                                disabled={!isCompleted}
                                            >
                        <span className="text-xs font-bold text-white">
                          {i + 1}
                        </span>
                                                {isCompleted && (
                                                    <div className="absolute -top-1 -right-1 flex gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onEdit({ type: 'university', data: university, institutionName });
                                                            }}
                                                            className="w-4 h-4 bg-sky-500 hover:bg-sky-600 rounded-full flex items-center justify-center text-white text-xs"
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
                <DialogContent className="max-w-md bg-gray-800 border-gray-700">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-white">
                            {selectedInstitution?.type === 'school' ? '🏫' : '🎓'}
                            {selectedInstitution?.institutionName}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedInstitution?.type === 'school' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-400">Class Level</label>
                                    <p className="text-lg font-semibold text-white">{selectedInstitution.data.displayName}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-400">Result</label>
                                    <p className="text-lg font-semibold text-green-400">{selectedInstitution.data.result}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-400">Academic Year</label>
                                    <p className="text-lg text-white">{selectedInstitution.data.academicYear}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-400">Completion Date</label>
                                    <p className="text-lg text-white">{selectedInstitution.data.completionDate}</p>
                                </div>
                            </div>

                            {selectedInstitution.data.certificateUrl && (
                                <div>
                                    <label className="text-sm font-medium text-gray-400">Certificate</label>
                                    <a
                                        href={selectedInstitution.data.certificateUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:underline"
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
                                    <label className="text-sm font-medium text-gray-400">Semester</label>
                                    <p className="text-lg font-semibold text-white">{selectedInstitution.data.semesterDisplayName}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-400">Result</label>
                                    <p className="text-lg font-semibold text-green-400">{selectedInstitution.data.semesterResult}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-400">Degree</label>
                                    <p className="text-lg text-white">{selectedInstitution.data.degreeName}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-400">Academic Year</label>
                                    <p className="text-lg text-white">{selectedInstitution.data.academicYear}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-400">Credits</label>
                                    <p className="text-lg text-white">{selectedInstitution.data.totalCredits}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-400">Status</label>
                                    <Badge variant={selectedInstitution.data.isCompleted ? "default" : "secondary"}>
                                        {selectedInstitution.data.isCompleted ? "Completed" : "In Progress"}
                                    </Badge>
                                </div>
                            </div>

                            {selectedInstitution.data.transcriptUrl && (
                                <div>
                                    <label className="text-sm font-medium text-gray-400">Transcript</label>
                                    <a
                                        href={selectedInstitution.data.transcriptUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:underline"
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