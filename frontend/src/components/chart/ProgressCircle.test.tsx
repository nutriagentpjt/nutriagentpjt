import { render, screen } from '@testing-library/react';
import { ProgressCircle } from './ProgressCircle';

describe('ProgressCircle', () => {
  it('renders consumed and goal text for normal progress', () => {
    render(<ProgressCircle consumed={1200} goal={2000} />);

    expect(screen.getByText('1200')).toBeInTheDocument();
    expect(screen.getByText('2000 kcal 중')).toBeInTheDocument();
    expect(screen.getByText('800 kcal 남음')).toBeInTheDocument();
  });

  it('renders over-goal summary when consumed exceeds goal', () => {
    render(<ProgressCircle consumed={2500} goal={2000} />);

    expect(screen.getByText('125%')).toBeInTheDocument();
    expect(screen.getByText('500 kcal 초과')).toBeInTheDocument();
  });
});
