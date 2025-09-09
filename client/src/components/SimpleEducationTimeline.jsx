import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, GraduationCap, School, Edit2, Trash2, Plus } from 'lucide-react';

// Theme tokens aligned with dashboard
const gradientPanel = 'bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm';
const subtleCard = 'bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors';

const SimpleEducationTimeline = ({ userId, onEdit, onDelete }) => {
    const [educationData, setEducationData] = useState(null);
    const [selectedInstitution, setSelectedInstitution] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showClassModal, setShowClassModal] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [loading, setLoading] = useState(true);
    const [classResultForm, setClassResultForm] = useState({
        classLevel: '',
        academicYear: '',
        result: ''
    });

    // Generate academic years
    const currentYear = new Date().getFullYear();
    const academicYears = Array.from({ length: 20 }, (_, i) => {
        const startYear = currentYear - i;
        return `${startYear}-${startYear + 1}`;
    });

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

    const openClassModal = (school) => {
        setSelectedSchool(school);
        setShowClassModal(true);
    };

    const handleClassResultSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please login again.');
            }

            const url = `http://localhost:8080/api/education/schools/${selectedSchool.id}/classes?classLevel=${classResultForm.classLevel}&academicYear=${encodeURIComponent(classResultForm.academicYear)}&result=${encodeURIComponent(classResultForm.result)}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || 'Failed to add class result');
            }

            setShowClassModal(false);
            setClassResultForm({ classLevel: '', academicYear: '', result: '' });
            fetchEducationData(); // Refresh data
        } catch (error) {
            console.error('Error adding class result:', error);
            alert(error.message || 'Failed to add class result');
        } finally {
            setLoading(false);
        }
    };

    // Group schools by school name
    const groupSchoolsByName = (schools) => {
        const grouped = {};
        schools.forEach(school => {
            if (!grouped[school.schoolName]) {
                grouped[school.schoolName] = [];
            }
            grouped[school.schoolName].push(school);
        });
        return grouped;
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
                    <p className="text-slate-600 dark:text-slate-300 text-center py-6">
                        Failed to load education data. Please try again.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const groupedSchools = groupSchoolsByName(educationData.schools || []);

    return (
        <div className="space-y-6">
            <Card className={`w-full rounded-2xl ${gradientPanel}`}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        <GraduationCap className="h-5 w-5 text-teal-600 dark:text-teal-400" /> Education Timeline
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Schools Section */}
                    {Object.keys(groupedSchools).length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <School className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">School Education</h3>
                            </div>

                            {Object.entries(groupedSchools).map(([schoolName, schoolClasses]) => (
                                <Card key={schoolName} className={`${subtleCard} rounded-xl border-l-4 border-l-teal-400`}>
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">
                                                    {schoolName}
                                                </h4>
                                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                                    {schoolClasses.length} class{schoolClasses.length !== 1 ? 'es' : ''} recorded
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openClassModal(schoolClasses[0])}
                                                    className="border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-600 dark:text-teal-300 dark:hover:bg-teal-900/20"
                                                >
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    Add Class
                                                </Button>
                                                {onEdit && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => onEdit({ type: 'school', data: schoolClasses[0] })}
                                                        className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/20"
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                    </Button>
                                                )}
                                                {onDelete && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => onDelete({ type: 'school', data: schoolClasses[0] })}
                                                        className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/20"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Class levels grid - clickable for classes without results */}
                                        <div className="grid grid-cols-6 gap-2">
                                            {Array.from({ length: 12 }, (_, i) => {
                                                const classLevel = i + 1;
                                                const hasResult = schoolClasses.some(sc => sc.classLevel === classLevel);
                                                const classData = schoolClasses.find(sc => sc.classLevel === classLevel);

                                                return (
                                                    <div
                                                        key={classLevel}
                                                        className={`
                                                            p-2 rounded-lg text-center text-xs font-medium cursor-pointer transition-all
                                                            ${hasResult
                                                                ? 'bg-gradient-to-br from-green-400 to-green-500 text-white shadow-sm'
                                                                : 'bg-slate-200/70 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 hover:bg-slate-300/70 dark:hover:bg-slate-600/40'
                                                            }
                                                        `}
                                                        onClick={() => {
                                                            if (hasResult) {
                                                                // Show result details
                                                                alert(`Class ${classLevel}\\nYear: ${classData.academicYear}\\nResult: ${classData.result}`);
                                                            } else {
                                                                // Open modal to add result
                                                                openClassModal(schoolClasses[0]);
                                                            }
                                                        }}
                                                        title={hasResult
                                                            ? `Class ${classLevel}: ${classData.result} (${classData.academicYear})`
                                                            : `Click to add result for Class ${classLevel}`
                                                        }
                                                    >
                                                        {classLevel === 10 ? 'SSC' : classLevel === 12 ? 'HSC' : classLevel}
                                                        {hasResult && (
                                                            <div className="text-xs opacity-75 mt-1">
                                                                {classData.result}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Universities Section */}
                    {educationData.universities && educationData.universities.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">University Education</h3>
                            </div>

                            {educationData.universities.map((university) => (
                                <Card key={university.id} className={`${subtleCard} rounded-xl border-l-4 border-l-indigo-400`}>
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-grow">
                                                <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">
                                                    {university.universityName}
                                                </h4>
                                                <p className="text-slate-600 dark:text-slate-300 font-medium">
                                                    {university.degreeName}
                                                </p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                                                        {university.semesterCount} Semesters
                                                    </Badge>
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-600">
                                                        CGPA: {university.cgpa ? university.cgpa.toFixed(2) : 'N/A'}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-slate-600 dark:text-slate-300">
                                                        {university.completedSemestersCount || 0}/{university.semesterCount || 0} Completed
                                                    </Badge>
                                                </div>
                                                
                                                {/* Semester Results Grid */}
                                                {university.semesterResults && university.semesterResults.length > 0 && (
                                                    <div className="mt-3">
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Semester Results:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {university.semesterResults.map((gpa, index) => (
                                                                <div
                                                                    key={index}
                                                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                                                        gpa && gpa > 0
                                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                                                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                                                    }`}
                                                                >
                                                                    S{index + 1}: {gpa ? gpa.toFixed(2) : 'N/A'}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                {onEdit && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => onEdit({ type: 'university', data: university })}
                                                        className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/20"
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                    </Button>
                                                )}
                                                {onDelete && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => onDelete({ type: 'university', data: university })}
                                                        className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/20"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {(!educationData.schools || educationData.schools.length === 0) &&
                        (!educationData.universities || educationData.universities.length === 0) && (
                            <div className="text-center py-8">
                                <GraduationCap className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-600 dark:text-slate-300">No education data found</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    Add your educational background to get started
                                </p>
                            </div>
                        )}
                </CardContent>
            </Card>

            {/* Class Result Modal */}
            <Dialog open={showClassModal} onOpenChange={setShowClassModal}>
                <DialogContent className="max-w-md bg-gray-800 border-gray-600">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            Add Class Result for {selectedSchool?.schoolName}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleClassResultSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="classLevel" className="text-gray-300">Class Level *</Label>
                            <Select value={classResultForm.classLevel} onValueChange={(value) => setClassResultForm({ ...classResultForm, classLevel: value })}>
                                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                    <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-700 border-gray-600">
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <SelectItem key={i + 1} value={(i + 1).toString()} className="text-white hover:bg-gray-600">
                                            {i + 1 === 10 ? 'SSC (Class 10)' : i + 1 === 12 ? 'HSC (Class 12)' : `Class ${i + 1}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="classAcademicYear" className="text-gray-300">Academic Year *</Label>
                            <Select value={classResultForm.academicYear} onValueChange={(value) => setClassResultForm({ ...classResultForm, academicYear: value })}>
                                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                    <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-700 border-gray-600">
                                    {academicYears.map(year => (
                                        <SelectItem key={year} value={year} className="text-white hover:bg-gray-600">{year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="classResult" className="text-gray-300">Result *</Label>
                            <Input
                                id="classResult"
                                value={classResultForm.result}
                                onChange={(e) => setClassResultForm({ ...classResultForm, result: e.target.value })}
                                placeholder="e.g., 5.00, A+, 95%"
                                required
                                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
                                {loading ? 'Adding...' : 'Add Result'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setShowClassModal(false)} className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white">
                                Cancel
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SimpleEducationTimeline;
