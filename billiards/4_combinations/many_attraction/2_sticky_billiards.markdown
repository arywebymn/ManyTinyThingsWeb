---
title: Sticky Billiards
---

<script>

    var sim = createSimulation({
        initialize: function(simulation) {
            var p = simulation.parameters;
            p.friction = 0.2;

            initBilliards(simulation, simulation.boxBounds);

            p.isOnlyHardSpheres = false;

            var ljInteraction = new LennardJonesInteraction();
            ljInteraction.strength = 3;
            setInteraction(simulation, 0, 0, ljInteraction);

            // TODO: maybe have the red particle not stick to the others

            setToolbarAvailableTools(simulation.toolbar, ["impulse"]);
        }
    });
</script>

Back to billiards!

Split the group-hugging triangle.

<script>
    cue(isBilliardsTriangleSplit(sim));
    endStep();
</script>

It's harder when they are sticking together, but with enough speed it's possible.
