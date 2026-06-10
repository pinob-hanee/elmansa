import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChapterDeadlineModal from '../pages/admin/components/ChapterDeadlineModal';
import { useQueryClient } from '@tanstack/react-query';

// Mock dependencies
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useQuery: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('ChapterDeadlineModal', () => {
  const mockOnClose = vi.fn();
  const mockCourse = {
    id: 'course-1',
    modules: [
      {
        id: 'mod-1',
        title: 'Module 1',
        chapters: [
          { id: 'chap-1', title: 'Chapter 1' }
        ]
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useQueryClient as any).mockReturnValue({
      invalidateQueries: vi.fn(),
    });
  });

  it('renders correctly with tabs', () => {
    render(
      <ChapterDeadlineModal 
        isOpen={true} 
        onClose={mockOnClose} 
        course={mockCourse as any} 
      />
    );

    expect(screen.getByText('admin.courses.deadlines.title')).toBeDefined();
    expect(screen.getByText('admin.courses.deadlines.tabs.global')).toBeDefined();
    expect(screen.getByText('admin.courses.deadlines.tabs.student')).toBeDefined();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <ChapterDeadlineModal 
        isOpen={true} 
        onClose={mockOnClose} 
        course={mockCourse as any} 
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i }); // Assuming an aria-label or accessible icon
    if(closeButton) {
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('switches to Student Deadlines tab when clicked', () => {
    render(
      <ChapterDeadlineModal 
        isOpen={true} 
        onClose={mockOnClose} 
        course={mockCourse as any} 
      />
    );

    const studentTab = screen.getByText('admin.courses.deadlines.tabs.student');
    fireEvent.click(studentTab);

    // Verify student-specific UI appears (e.g. search input for students)
    expect(screen.getByPlaceholderText('admin.courses.deadlines.searchStudent')).toBeDefined();
  });
});
