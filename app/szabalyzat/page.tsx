const SZABALYOK = [
  'Kommunikálj tisztelettel másokkal.',
  'Ne zaklass másokat.',
  'Ne oszd meg mások személyes adatait.',
  'Ne küldj kéretlen szexuális tartalmat.',
  'Ne reklámozz illegális tevékenységet.',
  'Ne adj veszélyes egészségügyi tanácsot.',
  'Ne élj vissza mások sérülékeny helyzetével.',
  'Fogadd el, ha valaki nem szeretne privát beszélgetést.',
  'Jelentsd a problémás tartalmat.',
];

export default function GuidelinesPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl text-moonlight-100">Közösségi szabályok</h1>
      <p className="mt-2 text-sm text-moonlight-300">
        A Hajnali Beszélgetések egy nyugodt, biztonságos tér. Ez nem társkereső és nem
        egészségügyi szolgáltatás - a moderátori csapat nem diagnosztizál, és nem nyújt
        szakmai tanácsadást. Krízishelyzetben mindig fordulj hivatalos segélyvonalhoz.
      </p>

      <ul className="mt-6 space-y-2">
        {SZABALYOK.map((szabaly) => (
          <li key={szabaly} className="rounded-lg border border-night-800 bg-night-900 p-3 text-sm text-moonlight-100">
            {szabaly}
          </li>
        ))}
      </ul>
    </div>
  );
}
