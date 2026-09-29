const T=(await import('./boot.mjs')).default;
console.log('solids',T.field.solids.length,'mode',T.get().mode,'castle stats',JSON.stringify(T.castle.stats));
