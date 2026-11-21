# best-stealth-game-20261121-1759

![Competition](https://make.fun/badge/best-stealth-game-20261121-1759.svg)
![Rank](https://make.fun/badge/best-stealth-game-20261121-1759/Farellcv90/best-stealth-game-20261121-1759/rank.svg)
![Reward](https://make.fun/badge/best-stealth-game-20261121-1759/Farellcv90/best-stealth-game-20261121-1759/reward.svg)

Entry for the make.fun bounty: https://make.fun/bounty/best-stealth-game-20261121-1759

## Lantern Thief — The Moon Pearl Heist

A top-down stealth game on a 2D canvas. You are the Lantern Thief, slipping
through a dark museum at night. Three handcrafted floors — the Gallery of
Statues, the Vault Corridor and the Rooftop Garden — each with patrolling
guards whose vision cones are clipped by walls and cover, pools of lamplight
that give you away, and shadow that keeps you safe. Steal the Moon Pearl,
then reach the green exit without being caught.

- **Move** with WASD or the arrow keys. **Hold Shift** to sneak: slower,
  silent, harder to spot.
- **Click** to throw a pebble — guards within earshot turn and investigate.
- Detection fills per guard (faster up close and in the light); at 35 they
  grow suspicious, at 100 they chase. Break line of sight and the meter drains.
- Guard footsteps pan and fade with distance, so you can hear a patrol coming.
- Cameras on the rooftop sweep blue cones and cannot be distracted.
- Finish unseen and fast for the Ghost rank — Rank S.

Everything is drawn in code and every sound is synthesised with WebAudio:
no external assets, no network requests, no libraries.

## Run it

```
node serve.ts
```

Then open http://localhost:8080. To build the submission dossier:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---
Built for make.fun — ref=bbbzard3
