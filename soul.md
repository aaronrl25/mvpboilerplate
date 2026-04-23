# Soul

This project exists because the gap between "I have an idea" and "I have a working app" is where most ideas die.

Not because the idea was bad. Not because the builder wasn't capable. But because the first 80% of any social app — auth, feeds, profiles, follows, media uploads, real-time updates — is the same across every idea. Writing it from scratch every time is a tax on imagination.

This boilerplate is the answer to that tax.

---

## What this is

A living, working social app — not a skeleton, not a toy. It has real users, real posts, real follows, real comments, real movies, real maps. Every feature is fully wired: Firebase on the backend, Expo on the device, Redux for state, Firestore snapshots keeping everything live.

You can run it today. You can ship a version of it next week.

The goal was never to abstract everything into a perfect architecture. The goal was to give someone a Tuesday afternoon and a real idea the best possible shot at becoming something.

---

## What drives the decisions

**Speed over elegance, but not speed over correctness.**
Redux is only used for auth because that's all it needs to do. Firestore real-time listeners are used directly in components because that's the fastest honest path to live data. The service layer exists because Firebase calls scattered across components become unmaintainable — not because of some pattern mandate.

**Features that teach.**
Each tab demonstrates something real: the feed shows media + social interactions, the map shows location awareness, movies show external API integration, the list shows personal state management, the AI tab shows where the frontier is. Together they cover the practical surface area of 80% of consumer apps.

**Cross-platform without compromise.**
iOS, Android, and Web from one codebase. That's the promise of Expo, and this project holds it.

---

## The user this is for

A builder. Someone who has shipped things before, or is about to ship their first thing. Someone who doesn't want to spend three weekends configuring Firebase before they can test whether their core idea resonates.

They know enough to customize. They don't want to start from zero.

---

## The things that must not break

- Auth must always work. If login/signup is broken, nothing else matters.
- The feed must be real-time. A social app where posts don't appear until refresh is a dead social app.
- Media upload must be reliable. Users will post photos and videos, and if those disappear, trust is gone.
- Follow/unfollow must be atomic. Counters that drift create confusion and erode confidence in the product.

---

## What this is not

This is not the final product. It's the launchpad.

The AI tab is a placeholder on purpose — that's where *your* differentiated idea goes. The movies feature is real but swappable — it's a pattern for "external API + detail view," not a commitment to movies. The task list is there to show that not every feature is social.

Strip what doesn't fit your vision. Keep what does. Build the rest.

---

## The spirit of the work

This project was demoed live — From Idea to App: Rapid MVP Development in React Native. That origin matters. It was never meant to live in a repo. It was meant to be handed to someone who would take it somewhere.

Every commit since then has been in service of that handoff. Make it easier to understand. Make it easier to modify. Make it harder to break.

The best version of this project is the one that someone else finishes.
