'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    X,
    Plus,
    Loader2,
    AlertCircle,
    Award,
    Code,
    Briefcase,
    FileText
} from 'lucide-react';

export default function EditPostModal({ isOpen, onClose, post, onSave }) {
    const [category, setCategory] = useState('');
    const [skills, setSkills] = useState([]);
    const [skillInput, setSkillInput] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [position, setPosition] = useState('');
    const [cvHeading, setCvHeading] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && post) {
            resetForm();
            // Try to determine initial category from post type
            switch (post.type?.toLowerCase()) {
                case 'achievement':
                    setCategory('ACHIEVEMENT');
                    setSkills(post.tags || []);
                    break;
                case 'project':
                    setCategory('PROJECT');
                    setSkills(post.tags || []);
                    break;
                case 'experience':
                    setCategory('PROFESSIONAL_EXPERIENCE');
                    // Extract company and position from tags if in format "Company,Position,Date"
                    if (post.tags && post.tags.length > 0) {
                        const parts = post.tags[0].split(',');
                        if (parts.length >= 2) {
                            setCompanyName(parts[0]);
                            setPosition(parts[1]);
                        }
                    }
                    break;
                default:
                    setCategory('ACHIEVEMENT'); // Default selection
            }
        }
    }, [isOpen, post]);

    const resetForm = () => {
        setCategory('');
        setSkills([]);
        setSkillInput('');
        setCompanyName('');
        setPosition('');
        setCvHeading('');
        setError('');
    };

    const addSkill = () => {
        const trimmedSkill = skillInput.trim();
        if (trimmedSkill && !skills.includes(trimmedSkill)) {
            setSkills([...skills, trimmedSkill]);
            setSkillInput('');
        }
    };

    const removeSkill = (skillToRemove) => {
        setSkills(skills.filter(skill => skill !== skillToRemove));
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addSkill();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!category) {
            setError('Please select a category');
            return;
        }

        if (category === 'PROFESSIONAL_EXPERIENCE' && (!companyName.trim() || !position.trim())) {
            setError('Company name and position are required for professional experience');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const requestData = {
                profileId: post.profileId,
                category: category,
                skills: (category === 'ACHIEVEMENT' || category === 'PROJECT') ? skills : null,
                companyName: category === 'PROFESSIONAL_EXPERIENCE' ? companyName.trim() : null,
                position: category === 'PROFESSIONAL_EXPERIENCE' ? position.trim() : null,
                cvHeading: (category === 'ACHIEVEMENT' || category === 'PROJECT') ? cvHeading.trim() || null : null
            };

            const response = await apiFetch(`/api/posts/${post.id}/manual-edit`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to update post: ${response.status}`);
            }

            const updatedPost = await response.json();

            // Call onSave callback with updated post data
            if (onSave) {
                onSave(updatedPost);
            }

            onClose();
        } catch (err) {
            setError(err.message);
            console.error('Error updating post:', err);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryIcon = (cat) => {
        switch (cat) {
            case 'ACHIEVEMENT': return <Award className="h-4 w-4" />;
            case 'PROJECT': return <Code className="h-4 w-4" />;
            case 'PROFESSIONAL_EXPERIENCE': return <Briefcase className="h-4 w-4" />;
            default: return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <DialogHeader>
                    <DialogTitle className="text-slate-800 dark:text-white">
                        Edit Post Category
                    </DialogTitle>
                </DialogHeader>

                {error && (
                    <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <AlertDescription className="text-red-800 dark:text-red-200">
                            {error}
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Category Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ACHIEVEMENT">
                                    <div className="flex items-center gap-2">
                                        <Award className="h-4 w-4 text-yellow-500" />
                                        Achievement
                                    </div>
                                </SelectItem>
                                <SelectItem value="PROJECT">
                                    <div className="flex items-center gap-2">
                                        <Code className="h-4 w-4 text-purple-500" />
                                        Project
                                    </div>
                                </SelectItem>
                                <SelectItem value="PROFESSIONAL_EXPERIENCE">
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-4 w-4 text-blue-500" />
                                        Professional Experience
                                    </div>
                                </SelectItem>
                                <SelectItem value="GENERAL">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-gray-500" />
                                        General
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Skills Input - Show for Achievement and Project */}
                    {(category === 'ACHIEVEMENT' || category === 'PROJECT') && (
                        <div className="space-y-2">
                            <Label htmlFor="skills">Skills/Technologies</Label>
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <Input
                                        id="skills"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Enter skill and press Enter"
                                        className="flex-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                                    />
                                    <Button
                                        type="button"
                                        onClick={addSkill}
                                        variant="outline"
                                        size="sm"
                                        className="border-slate-300 dark:border-slate-600"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                {skills.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {skills.map((skill, index) => (
                                            <Badge
                                                key={index}
                                                className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
                                                onClick={() => removeSkill(skill)}
                                            >
                                                {skill}
                                                <X className="h-3 w-3 ml-1" />
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* CV Heading Input - Show for Achievement and Project */}
                    {(category === 'ACHIEVEMENT' || category === 'PROJECT') && (
                        <div className="space-y-2">
                            <Label htmlFor="cvHeading">CV Heading (optional)</Label>
                            <Input
                                id="cvHeading"
                                value={cvHeading}
                                onChange={(e) => setCvHeading(e.target.value)}
                                placeholder="Enter custom CV heading"
                                className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                            />
                            <p className="text-sm text-gray-500">
                                This will be used as the heading in your CV for this entry. Leave blank to use default.
                            </p>
                        </div>
                    )}

                    {/* Company and Position - Show for Professional Experience */}
                    {category === 'PROFESSIONAL_EXPERIENCE' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="company">Company Name *</Label>
                                <Input
                                    id="company"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="Enter company name"
                                    className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="position">Position *</Label>
                                <Input
                                    id="position"
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                    placeholder="Enter position/job title"
                                    className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                                />
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                            className="border-slate-300 dark:border-slate-600"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-teal-600 hover:bg-teal-700 text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}