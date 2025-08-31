import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Brain,
  Target,
  Users,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Plus
} from "lucide-react";
import { useState } from "react";

export const CourseCreation = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [generatedCRA, setGeneratedCRA] = useState(false);
  
  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const mockCRAData = [
    { area: "Algebra", ks: ["Variables", "Equations", "Functions"], initialCL: 75, initialAC: "Strong foundation needed" },
    { area: "Geometry", ks: ["Shapes", "Proofs", "Measurements"], initialCL: 68, initialAC: "Visual learning preferred" },
    { area: "Statistics", ks: ["Data Analysis", "Probability", "Graphs"], initialCL: 82, initialAC: "Excel at interpretation" }
  ];

  const handleGenerateCRA = () => {
    setGeneratedCRA(true);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-primary mb-4">Basic Course Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="courseName">Course Name</Label>
                  <Input id="courseName" placeholder="e.g., Advanced Mathematics" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gradeLevel">Grade Level</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9">Grade 9</SelectItem>
                      <SelectItem value="10">Grade 10</SelectItem>
                      <SelectItem value="11">Grade 11</SelectItem>
                      <SelectItem value="12">Grade 12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Area</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="math">Mathematics</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="history">History</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Course Duration</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semester">Semester</SelectItem>
                      <SelectItem value="year">Full Year</SelectItem>
                      <SelectItem value="quarter">Quarter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Course Description</Label>
              <Textarea 
                id="description" 
                placeholder="Describe the course objectives, key topics, and learning outcomes..."
                className="min-h-[100px]"
              />
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-primary mb-4">Learning Objectives</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="objectives">Course Objectives</Label>
                  <Textarea 
                    id="objectives" 
                    placeholder="List the main learning objectives for this course..."
                    className="min-h-[120px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prerequisites">Prerequisites</Label>
                  <Textarea 
                    id="prerequisites" 
                    placeholder="What should students know before taking this course?"
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resources">Additional Resources</Label>
                  <Textarea 
                    id="resources" 
                    placeholder="List textbooks, websites, or other resources..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-primary mb-4">Generate CRA Table</h3>
              <p className="text-muted-foreground mb-6">
                Our AI will analyze your course information to generate a comprehensive Content-Related Abilities (CRA) table.
              </p>
              
              {!generatedCRA ? (
                <div className="bg-accent/30 p-6 rounded-lg border border-border">
                  <div className="text-center">
                    <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-primary mb-2">Ready to Generate CRA</h4>
                    <p className="text-muted-foreground mb-4">
                      Click below to let our AI create your personalized CRA table based on your course details.
                    </p>
                    <Button onClick={handleGenerateCRA} className="bg-gradient-hero shadow-glow">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate CRA Table
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span className="font-medium text-success">CRA Table Generated Successfully</span>
                  </div>
                  
                  {mockCRAData.map((area, index) => (
                    <Card key={index} className="bg-gradient-card shadow-soft">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-primary">{area.area}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Knowledge & Skills</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {area.ks.map((skill, skillIndex) => (
                                <Badge key={skillIndex} variant="secondary">{skill}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Initial CL Score</Label>
                              <div className="text-lg font-semibold text-primary">{area.initialCL}%</div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Assessment Context</Label>
                              <p className="text-sm text-muted-foreground">{area.initialAC}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-primary mb-4">Review & Create</h3>
              <p className="text-muted-foreground mb-6">
                Review your course setup before creating your Perleap course.
              </p>
              
              <div className="space-y-4">
                <Card className="bg-gradient-card shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <span>Course Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Name:</span> Advanced Mathematics</div>
                      <div><span className="text-muted-foreground">Grade:</span> Grade 11</div>
                      <div><span className="text-muted-foreground">Subject:</span> Mathematics</div>
                      <div><span className="text-muted-foreground">Duration:</span> Full Year</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-card shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="w-5 h-5 text-primary" />
                      <span>CRA Areas Generated</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {mockCRAData.map((area, index) => (
                        <Badge key={index} className="bg-gradient-hero text-white">{area.area}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="bg-accent/30 p-6 rounded-lg border border-border">
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-primary mb-2">Ready to Launch</h4>
                    <p className="text-muted-foreground mb-4">
                      Your Perleap course is ready! You can start creating activities and inviting students.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole="teacher" />
      
      <main className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Create New Perleap Course</h1>
          <p className="text-muted-foreground">Set up your AI-powered learning experience in just a few steps</p>
        </div>

        {/* Progress */}
        <Card className="mb-8 bg-gradient-card shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Step {currentStep} of {totalSteps}</span>
              <span className="text-sm font-medium text-primary">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-4 text-xs text-muted-foreground">
              <span>Basic Info</span>
              <span>Objectives</span>
              <span>CRA Generation</span>
              <span>Review</span>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="mb-8 bg-gradient-card shadow-medium">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          {currentStep < totalSteps ? (
            <Button 
              onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
              disabled={currentStep === 3 && !generatedCRA}
              className="bg-gradient-hero shadow-glow"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button className="bg-gradient-hero shadow-glow">
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};