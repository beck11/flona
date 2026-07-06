import SmoothScroll from '@/components/SmoothScroll';
import CinematicExperience from '@/components/CinematicExperience';
import AudioSystem from '@/components/AudioSystem';

export default function Home() {
  return (
    <SmoothScroll>
      <main>
        <CinematicExperience />
        <AudioSystem />
      </main>
    </SmoothScroll>
  );
}
