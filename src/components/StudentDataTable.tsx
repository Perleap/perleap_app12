import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface StudentData {
  id: string;
  name: string;
  course: string;
  lastActivity: string;
  status: 'completed' | 'in_progress' | 'not_started';
}

export const StudentDataTable = () => {
  const { t } = useLanguage();
  const [studentData, setStudentData] = useState<StudentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get teacher's courses and enrolled students
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select(`
            student_id,
            courses!inner (
              id,
              title,
              teacher_id
            ),
            profiles!course_enrollments_student_id_fkey (
              full_name,
              email
            )
          `)
          .eq('courses.teacher_id', user.id)
          .limit(10);

        if (enrollments) {
          const studentsWithActivity = await Promise.all(
            enrollments.map(async (enrollment) => {
              // Get latest activity run for this student in this course
              const { data: latestRun } = await supabase
                .from('activity_runs')
                .select(`
                  status,
                  completed_at,
                  activities (
                    title,
                    course_id
                  )
                `)
                .eq('student_id', enrollment.student_id)
                .eq('activities.course_id', enrollment.courses.id)
                .order('started_at', { ascending: false })
                .limit(1);

              const run = latestRun?.[0];
              
              return {
                id: `${enrollment.student_id}-${enrollment.courses.id}`,
                name: enrollment.profiles?.full_name || enrollment.profiles?.email || 'Unknown',
                course: enrollment.courses.title,
                lastActivity: run?.completed_at 
                  ? new Date(run.completed_at).toLocaleDateString()
                  : 'No activity',
                status: (run?.status as 'completed' | 'in_progress' | 'not_started') || 'not_started'
              };
            })
          );

          setStudentData(studentsWithActivity);
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, []);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'not_started':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return t('status.completed');
      case 'in_progress': return t('status.inProgress');
      case 'not_started': return t('status.notStarted');
      default: return t('status.unknown');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">{t('table.recentActivity')}</h3>
        <div className="text-sm text-muted-foreground">{t('table.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary">{t('table.recentActivity')}</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">{t('table.latest')}</span>
          <Badge variant="outline" className="bg-primary text-primary-foreground">
            {t('table.students')}
          </Badge>
        </div>
      </div>

      {studentData.length === 0 ? (
        <div className="text-sm text-muted-foreground">{t('table.noData')}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">{t('table.student')}</TableHead>
              <TableHead>{t('table.course')}</TableHead>
              <TableHead>{t('table.lastActivity')}</TableHead>
              <TableHead>{t('table.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentData.map((student) => (
              <TableRow key={student.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{student.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{student.course}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{student.lastActivity}</TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className={getStatusColor(student.status)}
                  >
                    {getStatusLabel(student.status)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};