from mesa.time import BaseScheduler


class SimultaneousActivation(BaseScheduler):
    """A scheduler to simulate the simultaneous activation of all the agents.

    This scheduler requires that each agent have two methods: step and advance.
    step() activates the agent and stages any necessary changes, but does not
    apply them yet. advance() then applies the changes.

    Copy from mesa.time.SimultaneousActivation with one fix
    """

    def step(self) -> None:
        """Step all agents, then advance them."""
        # Fix: iterate over copy of list, so that agents can remove themselves.
        for agent in list(self._agents.values()):
            agent.step()
        # the previous steps might remove some agents, but
        # this loop will go over the remaining existing agents
        for agent in list(self._agents.values()):
            agent.advance()
        self.steps += 1
        self.time += 1
