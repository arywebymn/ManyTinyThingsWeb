---
title: Break Shot
---

<script>
    var sim = createSimulation({
        initialize: function(simulation) {
            var p = simulation.parameters;
            p.friction = 0.2;

            initBilliards(simulation, simulation.boxBounds);

    		setToolbarAvailableTools(simulation.toolbar, ["impulse"]);
        }
    });
</script>


I added some more balls!

You know what to do.

<script>
	cue(isBilliardsTriangleSplit(sim));
	endStep();
</script>

Nice break shot!

_Wait, why are we playing billiards?_
