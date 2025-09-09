import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const EducationForm = ({ onSuccess, editData = null }) => {
    const [activeTab, setActiveTab] = useState('school');
    const [loading, setLoading] = useState(false);

    // School form state
    const [schoolForm, setSchoolForm] = useState({
        schoolName: '',
        classLevel: '',
        academicYear: '',
        result: '',
        resultType: '',
        completionDate: '',
        certificateUrl: ''
    });

    // University form state
    const [universityForm, setUniversityForm] = useState({
        universityName: '',
        degreeName: '',
        semesterCount: '',
        semesterResults: []
    });

    useEffect(() => {
        if (editData) {
            if (editData.type === 'school') {
                setSchoolForm({
                    schoolName: editData.data.schoolName || '',
                    classLevel: editData.data.classLevel?.toString() || '',
                    academicYear: editData.data.academicYear || '',
                    result: editData.data.result || '',
                    resultType: editData.data.resultType || '',
                    completionDate: editData.data.completionDate || '',
                    certificateUrl: editData.data.certificateUrl || ''
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
        console.log('1. Starting handleSchoolSubmit');
        e.preventDefault();
        console.log('2. Prevented default form submission');
        setLoading(true);
        console.log('3. Set loading to true');

        try {
            console.log('4. Entered try block');
            const token = localStorage.getItem('token');
            console.log('5. Got token from localStorage:', token);
            if (!token) {
                console.log('6. No token found');
                throw new Error('No authentication token found. Please login again.');
            }

            const resultType = parseInt(schoolForm.classLevel) === 10 ? 'SSC' :
                parseInt(schoolForm.classLevel) === 12 ? 'HSC' : 'Regular';
            console.log('7. Determined resultType:', resultType);

            const payload = {
                ...schoolForm,
                classLevel: parseInt(schoolForm.classLevel),
                resultType: schoolForm.resultType || resultType
            };
            console.log('8. Created payload:', payload);

            const options = {
                method: editData?.type === 'school' ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            };
            console.log('9. Created request options:', options);

            const url = editData?.type === 'school'
                ? `http://localhost:8080/api/education/schools/${editData.data.id}`
                : 'http://localhost:8080/api/education/schools';
            console.log('10. Determined URL:', url);

            console.log('11. Making fetch request...');
            const response = await fetch(url, options);
            console.log('12. Got response:', response);

            const responseData = await response.text();
            console.log('13. Got response text:', responseData);

            if (!response.ok) {
                console.log('14. Response not OK');
                try {
                    const errorData = JSON.parse(responseData);
                    console.log('15. Parsed error data:', errorData);
                    throw new Error(errorData.message || `Request failed with status ${response.status}`);
                } catch {
                    console.log('16. Could not parse error data');
                    throw new Error(responseData || `HTTP error! status: ${response.status}`);
                }
            }

            console.log('17. Response is OK');
            try {
                const data = responseData ? JSON.parse(responseData) : {};
                console.log('18. Parsed response data:', data);
                onSuccess();
                console.log('19. Called onSuccess');
                resetSchoolForm();
                console.log('20. Reset school form');
                return data;
            } catch (jsonError) {
                console.warn('21. Response was OK but could not parse JSON:', jsonError);
                onSuccess();
                resetSchoolForm();
                return {};
            }
        } catch (error) {
            console.log('22. Entered catch block');
            console.error('Error saving school:', error);
            if (error.message.includes('403')) {
                console.log('23. 403 Forbidden error detected');
                alert('Access denied. Please check your permissions or login again.');
            } else {
                console.log('24. Other error detected');
                alert(error.message || 'Failed to save school data');
            }
            throw error;
        } finally {
            console.log('25. Entered finally block');
            setLoading(false);
            console.log('26. Set loading to false');
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

            const response = await fetch(url, options);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save university data');
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
            classLevel: '',
            academicYear: '',
            result: '',
            resultType: '',
            completionDate: '',
            certificateUrl: ''
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

    const currentYear = new Date().getFullYear();
    const academicYears = Array.from({ length: 10 }, (_, i) => `${currentYear - i}-${currentYear - i + 1}`);

    return (
        <Card className="w-full max-w-2xl bg-gray-800/50 border-gray-700/50">
            <CardHeader>
                <CardTitle className="text-white">
                    {editData ? 'Edit Education' : 'Add Education'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 bg-gray-700 border-gray-600">
                        <TabsTrigger value="school" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white text-gray-300">🏫 School</TabsTrigger>
                        <TabsTrigger value="university" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white text-gray-300">🎓 University</TabsTrigger>
                    </TabsList>

                    <TabsContent value="school" className="space-y-4">
                        <form onSubmit={handleSchoolSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="schoolName" className="text-gray-300">School Name *</Label>
                                    <Input
                                        id="schoolName"
                                        value={schoolForm.schoolName}
                                        onChange={(e) => setSchoolForm({...schoolForm, schoolName: e.target.value})}
                                        placeholder="Enter school name"
                                        required
                                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="classLevel" className="text-gray-300">Class Level *</Label>
                                    <Select value={schoolForm.classLevel} onValueChange={(value) => setSchoolForm({...schoolForm, classLevel: value})}>
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
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="academicYear" className="text-gray-300">Academic Year *</Label>
                                    <Select value={schoolForm.academicYear} onValueChange={(value) => setSchoolForm({...schoolForm, academicYear: value})}>
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
                                    <Label htmlFor="result" className="text-gray-300">Result *</Label>
                                    <Input
                                        id="result"
                                        value={schoolForm.result}
                                        onChange={(e) => setSchoolForm({...schoolForm, result: e.target.value})}
                                        placeholder="e.g., 5.00, A+, 95%"
                                        required
                                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="completionDate" className="text-gray-300">Completion Date</Label>
                                    <Input
                                        id="completionDate"
                                        type="date"
                                        value={schoolForm.completionDate}
                                        onChange={(e) => setSchoolForm({...schoolForm, completionDate: e.target.value})}
                                        className="bg-gray-700 border-gray-600 text-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="certificateUrl" className="text-gray-300">Certificate URL</Label>
                                    <Input
                                        id="certificateUrl"
                                        value={schoolForm.certificateUrl}
                                        onChange={(e) => setSchoolForm({...schoolForm, certificateUrl: e.target.value})}
                                        placeholder="https://example.com/certificate"
                                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
                                    {loading ? 'Saving...' : editData ? 'Update School' : 'Add School'}
                                </Button>
                                {editData && (
                                    <Button type="button" variant="outline" onClick={resetSchoolForm} className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white">
                                        Reset
                                    </Button>
                                )}
                            </div>
                        </form>
                    </TabsContent>

                    <TabsContent value="university" className="space-y-4">
                        <form onSubmit={handleUniversitySubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="universityName" className="text-gray-300">University Name *</Label>
                                    <Input
                                        id="universityName"
                                        value={universityForm.universityName}
                                        onChange={(e) => setUniversityForm({...universityForm, universityName: e.target.value})}
                                        placeholder="Enter university name"
                                        required
                                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="degreeName" className="text-gray-300">Degree Name *</Label>
                                    <Input
                                        id="degreeName"
                                        value={universityForm.degreeName}
                                        onChange={(e) => setUniversityForm({...universityForm, degreeName: e.target.value})}
                                        placeholder="e.g., BSc in Computer Science"
                                        required
                                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="semesterCount" className="text-gray-300">Total Semesters *</Label>
                                <Input
                                    id="semesterCount"
                                    type="number"
                                    min="1"
                                    max="16"
                                    value={universityForm.semesterCount}
                                    onChange={(e) => setUniversityForm({...universityForm, semesterCount: e.target.value})}
                                    placeholder="e.g., 8"
                                    required
                                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                                />
                            </div>

                            {/* Semester Results Section */}
                            {universityForm.semesterCount && (
                                <div className="space-y-4">
                                    <Label className="text-gray-300">Semester Results (GPA)</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Array.from({ length: parseInt(universityForm.semesterCount) || 0 }, (_, i) => (
                                            <div key={i} className="space-y-1">
                                                <Label className="text-sm text-gray-400">Semester {i + 1}</Label>
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
                                                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}


                            <div className="flex gap-2">
                                <Button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
                                    {loading ? 'Saving...' : editData ? 'Update University' : 'Add University'}
                                </Button>
                                {editData && (
                                    <Button type="button" variant="outline" onClick={resetUniversityForm} className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white">
                                        Reset
                                    </Button>
                                )}
                            </div>
                        </form>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};

export default EducationForm;