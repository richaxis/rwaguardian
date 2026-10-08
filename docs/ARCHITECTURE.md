# RWA Guardian architecture

```text
Frontend
   |
   v
GenLayer Transaction Kit
   |
   v
RWA Guardian Intelligent Contract
   |
   +--> web evidence
   |
   +--> GenLayer nondeterministic evaluation
   |
   +--> Equivalence Principle
   |
   v
Onchain verification state
```

The frontend should not make the verification decision itself. The
Intelligent Contract is the source of the verification result.
