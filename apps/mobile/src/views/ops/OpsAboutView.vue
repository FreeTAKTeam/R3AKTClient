<template>
  <section class="ops-surface">
    <h1>About R3AKTMobile</h1>
    <p>
      Mobile parity shell for RCH. Feature traffic is routed through Rust envelope operations,
      with no new REST feature API dependency.
    </p>
  </section>
</template>

<style scoped>
.ops-surface {
  background: rgb(9 21 50 / 84%);
  border: 1px solid rgb(80 124 188 / 38%);
  border-radius: 14px;
  display: grid;
  gap: 0.5rem;
  padding: 0.9rem;
}

h1 {
  font-family: var(--font-headline);
  font-size: clamp(1.4rem, 3vw, 2rem);
  margin: 0;
}

p {
  color: #8faad3;
  font-family: var(--font-body);
  margin: 0;
}
</style>
