// The des-kids-games icon: takes the player to the list of all games.
export function HomeLink({ label }: { label: string }) {
  return (
    <a className='home-link' href='/des-kids-games/' aria-label={label}>
      <svg viewBox='0 0 64 64' aria-hidden='true'>
        <rect width='64' height='64' rx='14' fill='#1971c2' />
        <rect x='7' y='20' width='50' height='26' rx='13' fill='#fff' />
        <rect x='14' y='30.5' width='13' height='5' rx='1.5' fill='#1971c2' />
        <rect x='18' y='26.5' width='5' height='13' rx='1.5' fill='#1971c2' />
        <circle cx='43' cy='28' r='3.6' fill='#ff8787' />
        <circle cx='49.5' cy='33' r='3.6' fill='#ffd43b' />
        <circle cx='43' cy='38.5' r='3.6' fill='#69db7c' />
        <circle cx='36.5' cy='33' r='3.6' fill='#4dabf7' />
      </svg>
    </a>
  );
}
