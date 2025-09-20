import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

const SimpleEducationForm = ({ onSuccess, editData = null }) => {
    const [activeTab, setActiveTab] = useState('school');
    const [loading, setLoading] = useState(false);

    // School form state - simplified to only school name
    const [schoolForm, setSchoolForm] = useState({
        schoolName: '',
    });

    // Class result modal state
    const [showClassModal, setShowClassModal] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [classResultForm, setClassResultForm] = useState({
        classLevel: '',
        academicYear: '',
        result: ''
    });

    // University form state - updated to new structure
    const [universityForm, setUniversityForm] = useState({
        universityName: '',
        degreeName: '',
        semesterCount: '',
        semesterResults: []
    });

    // Generate academic years
    const currentYear = new Date().getFullYear();
    const academicYears = Array.from({ length: 20 }, (_, i) => {
        const startYear = currentYear - i;
        return `${startYear}-${startYear + 1}`;
    });

    useEffect(() => {
        if (editData) {
            if (editData.type === 'school') {
                setSchoolForm({
                    schoolName: editData.data.schoolName || '',
                });
                setActiveTab('school');
            } else {
                setUniversityForm({
                    universityName: editData.data.universityName || '',
                    degreeName: editData.data.degreeName || '',
                    semesterCount: editData.data.semesterCount?.toString() || '',
                    semesterResults: editData.data.semesterResults || []
                });
                setActiveTab('university');
            }
        }
    }, [editData]);

    const handleSchoolSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please login again.');
            }

            // For school, we only create an entry with school name and default class 1
            const payload = {
                schoolName: schoolForm.schoolName,
                classLevel: 1, // Default class level, user will add specific classes later
                academicYear: '',
                result: ''
            };

            const options = {
                method: editData?.type === 'school' ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            };

            const url = editData?.type === 'school'
                ? `http://localhost:8080/api/education/schools/${editData.data.id}`
                : 'http://localhost:8080/api/education/schools';

            const response = await fetch(url, options);

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || `HTTP error! status: ${response.status}`);
            }

            onSuccess();
            resetSchoolForm();
        } catch (error) {
            console.error('Error saving school:', error);
            alert(error.message || 'Failed to save school data');
        } finally {
            setLoading(false);
        }
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
            resetClassResultForm();
            onSuccess();
        } catch (error) {
            console.error('Error adding class result:', error);
            alert(error.message || 'Failed to add class result');
        } finally {
            setLoading(false);
        }
    };

    const handleUniversitySubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const payload = {
                ...universityForm,
                semesterCount: parseInt(universityForm.semesterCount),
                semesterResults: universityForm.semesterResults.map(gpa => parseFloat(gpa) || 0)
            };

            console.log('Sending university data:', payload);

            const options = {
                method: editData?.type === 'university' ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            };

            const url = editData?.type === 'university'
                ? `http://localhost:8080/api/education/universities/${editData.data.id}`
                : 'http://localhost:8080/api/education/universities';

            console.log('Making request to:', url);
            console.log('Request options:', options);

            const response = await fetch(url, options);

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                let errorMessage = 'Failed to save university data';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonError) {
                    // If response is not JSON, get text or use status text
                    errorMessage = response.statusText || `HTTP ${response.status}`;
                }
                throw new Error(errorMessage);
            }

            onSuccess();
            resetUniversityForm();
        } catch (error) {
            console.error('Error saving university:', error);
            alert(error.message || 'Failed to save university data');
        } finally {
            setLoading(false);
        }
    };

    const resetSchoolForm = () => {
        setSchoolForm({
            schoolName: '',
        });
    };

    const resetClassResultForm = () => {
        setClassResultForm({
            classLevel: '',
            academicYear: '',
            result: ''
        });
    };

    const resetUniversityForm = () => {
        setUniversityForm({
            universityName: '',
            degreeName: '',
            semesterCount: '',
            semesterResults: []
        });
    };

    const openClassResultModal = (school) => {
        setSelectedSchool(school);
        setShowClassModal(true);
    };

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50">
                    <TabsTrigger value="school" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-slate-600 dark:text-slate-400">
                        School Education
                    </TabsTrigger>
                    <TabsTrigger value="university" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-slate-600 dark:text-slate-400">
                        University Education
                    </TabsTrigger>
                </TabsList>

                <div className="bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors rounded-lg p-6">
                    <TabsContent value="school" className="space-y-4">
                        <form onSubmit={handleSchoolSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="schoolName" className="text-slate-800 dark:text-slate-100">School Name *</Label>
                                <Input
                                    id="schoolName"
                                    value={schoolForm.schoolName}
                                    onChange={(e) => setSchoolForm({ ...schoolForm, schoolName: e.target.value })}
                                    placeholder="Enter school name"
                                    required
                                    className="bg-white/80 dark:bg-slate-700/80 border-teal-900/10 dark:border-slate-600/60 text-slate-800 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-teal-500/50 dark:focus:border-teal-400/50"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={loading} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white">
                                    {loading ? 'Saving...' : editData ? 'Update School' : 'Add School'}
                                </Button>
                                {editData && (
                                    <Button type="button" variant="outline" onClick={resetSchoolForm} className="border-teal-900/20 dark:border-slate-600/60 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-600/60 hover:text-slate-800 dark:hover:text-white">
                                        Reset
                                    </Button>
                                )}
                            </div>
                        </form>

                        <div className="mt-6 pt-6 border-t border-teal-900/10 dark:border-slate-600/60">
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                After adding a school, you can click on specific class levels to add results and academic years for that class.
                            </p>
                        </div>
                    </TabsContent>

                    <TabsContent value="university" className="space-y-4">
                        <form onSubmit={handleUniversitySubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="universityName" className="text-slate-800 dark:text-slate-100">University Name *</Label>
                                    <Input
                                        id="universityName"
                                        value={universityForm.universityName}
                                        onChange={(e) => setUniversityForm({ ...universityForm, universityName: e.target.value })}
                                        placeholder="Enter university name"
                                        required
                                        className="bg-white/80 dark:bg-slate-700/80 border-teal-900/10 dark:border-slate-600/60 text-slate-800 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-teal-500/50 dark:focus:border-teal-400/50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="degreeName" className="text-slate-800 dark:text-slate-100">Degree Name *</Label>
                                    <Input
                                        id="degreeName"
                                        value={universityForm.degreeName}
                                        onChange={(e) => setUniversityForm({ ...universityForm, degreeName: e.target.value })}
                                        placeholder="e.g., Bachelor of Science in Computer Science"
                                        required
                                        className="bg-white/80 dark:bg-slate-700/80 border-teal-900/10 dark:border-slate-600/60 text-slate-800 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-teal-500/50 dark:focus:border-teal-400/50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="semesterCount" className="text-slate-800 dark:text-slate-100">Total Semesters *</Label>
                                <Input
                                    id="semesterCount"
                                    type="number"
                                    min="1"
                                    max="16"
                                    value={universityForm.semesterCount}
                                    onChange={(e) => setUniversityForm({...universityForm, semesterCount: e.target.value})}
                                    placeholder="e.g., 8"
                                    required
                                    className="bg-white/80 dark:bg-slate-700/80 border-teal-900/10 dark:border-slate-600/60 text-slate-800 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-teal-500/50 dark:focus:border-teal-400/50"
                                />
                            </div>

                            {/* Semester Results Section */}
                            {universityForm.semesterCount && (
                                <div className="space-y-4">
                                    <Label className="text-slate-800 dark:text-slate-100">Semester Results (GPA)</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Array.from({ length: parseInt(universityForm.semesterCount) || 0 }, (_, i) => (
                                            <div key={i} className="space-y-1">
                                                <Label className="text-sm text-slate-600 dark:text-slate-400">Semester {i + 1}</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="4"
                                                    value={universityForm.semesterResults[i] || ''}
                                                    onChange={(e) => {
                                                        const newResults = [...universityForm.semesterResults];
                                                        newResults[i] = e.target.value;
                                                        setUniversityForm({...universityForm, semesterResults: newResults});
                                                    }}
                                                    placeholder="0.00"
                                                    className="bg-white/80 dark:bg-slate-700/80 border-teal-900/10 dark:border-slate-600/60 text-slate-800 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-teal-500/50 dark:focus:border-teal-400/50"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button type="submit" disabled={loading} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white">
                                    {loading ? 'Saving...' : editData ? 'Update University' : 'Add University'}
                                </Button>
                                {editData && (
                                    <Button type="button" variant="outline" onClick={resetUniversityForm} className="border-teal-900/20 dark:border-slate-600/60 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-600/60 hover:text-slate-800 dark:hover:text-white">
                                        Reset
                                    </Button>
                                )}
                            </div>
                        </form>
                    </TabsContent>
                </div>
            </Tabs>

            {/* Class Result Modal */}
            <Dialog open={showClassModal} onOpenChange={setShowClassModal}>
                <DialogContent className="max-w-md bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/20 dark:border-slate-600/60">
                    <DialogHeader>
                        <DialogTitle className="text-slate-800 dark:text-white">
                            Add Class Result for {selectedSchool?.schoolName}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleClassResultSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="classLevel" className="text-slate-800 dark:text-slate-100">Class Level *</Label>
                            <Select value={classResultForm.classLevel} onValueChange={(value) => setClassResultForm({ ...classResultForm, classLevel: value })}>
                                <SelectTrigger className="bg-white/80 dark:bg-slate-700/80 border-teal-900/10 dark:border-slate-600/60 text-slate-800 dark:text-white">
                                    <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent className="bg-white/95 dark:bg-slate-700/95 border-teal-900/20 dark:border-slate-600/60 backdrop-blur-md">
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <SelectItem key={i + 1} value={(i + 1).toString()} className="text-slate-800 dark:text-white hover:bg-teal-50 dark:hover:bg-slate-600/60">
                                            {i + 1 === 10 ? 'SSC (Class 10)' : i + 1 === 12 ? 'HSC (Class 12)' : `Class ${i + 1}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="classAcademicYear" className="text-slate-800 dark:text-slate-100">Academic Year *</Label>
                            <Select value={classResultForm.academicYear} onValueChange={(value) => setClassResultForm({ ...classResultForm, academicYear: value })}>
                                <SelectTrigger className="bg-white/80 dark:bg-slate-700/80 border-teal-900/10 dark:border-slate-600/60 text-slate-800 dark:text-white">
                                    <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                                <SelectContent className="bg-white/95 dark:bg-slate-700/95 border-teal-900/20 dark:border-slate-600/60 backdrop-blur-md">
                                    {academicYears.map(year => (
                                        <SelectItem key={year} value={year} className="text-slate-800 dark:text-white hover:bg-teal-50 dark:hover:bg-slate-600/60">{year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="classResult" className="text-slate-800 dark:text-slate-100">Result *</Label>
                            <Input
                                id="classResult"
                                value={classResultForm.result}
                                onChange={(e) => setClassResultForm({ ...classResultForm, result: e.target.value })}
                                placeholder="e.g., 5.00, A+, 95%"
                                required
                                className="bg-white/80 dark:bg-slate-700/80 border-teal-900/10 dark:border-slate-600/60 text-slate-800 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-teal-500/50 dark:focus:border-teal-400/50"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" disabled={loading} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white">
                                {loading ? 'Adding...' : 'Add Result'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setShowClassModal(false)} className="border-teal-900/20 dark:border-slate-600/60 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-600/60 hover:text-slate-800 dark:hover:text-white">
                                Cancel
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SimpleEducationForm;
