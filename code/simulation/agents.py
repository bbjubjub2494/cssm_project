import mesa

from enum import Enum

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import TrafficModel


class TrafficAgent(mesa.Agent):
    """The main traffic agents. It's either a car or a bike.
    It has a velocity which indicates the number of cells it's moving forward in the current step.
    """

    class Type(Enum):
        CAR = 0
        BIKE = 1

    class Direction(Enum):
        UP = 0
        RIGHT = 1
        DOWN = 2
        LEFT = 3

    model: "TrafficModel"

    def __init__(self, unique_id, model: "TrafficModel", type: Type, dir: Direction):
        """Initialize a new agent with velocity 0.

        Args:
            model: Name of the model.
            type: Type car or bike that the agent represents
            dir: Direction in which the agents is moving.
        """
        super().__init__(unique_id, model)
        self.type = type
        self.direction = dir
        self.velocity = 0

        # Max velocity of cars (5) and bikes (3)
        if self.type == self.Type.CAR:
            self.max_velocity = 5
        else:
            self.max_velocity = 3

    def __str__(self):
        """Return string representation of the current agent."""
        return f"TrafficAgent id={self.unique_id} type={self.type.name} dir={self.direction.name} velocity={self.velocity} pos={self.pos}"

    def step(self):
        """Stage movement, but don't apply it yet. See method `advance`.
        Calculate the velocity and position for the next move.
        """

        # Rules of Nagel-Schreckenberg Model: https://en.wikipedia.org/wiki/Nagel%E2%80%93Schreckenberg_model#Outline_of_the_model
        # 1. Acceleration
        self.velocity = min(self.max_velocity, self.velocity + 1)

        # 2. Slow down
        for i, pos in enumerate(self.get_neighborhood()):
            if (
                self.model.grid[pos] != None
                or self.model.is_red_light(pos, self.direction)
                or self.is_car_on_bike_box(pos)
            ):
                self.velocity = min(i, self.velocity)
                break

        # 3. Randomization
        if self.random.random() < self.model.p_slow_down:
            self.velocity -= 1
            self.velocity = max(self.velocity, 0)

        # 4. Motion
        if self.velocity > 0:
            self.__next_pos = self.next_pos(self.velocity)
        else:
            self.__next_pos = None

        # EXTRA: Bike boxes
        # If a bike stands in line before a red traffic light and the bike box is not full yet, then fill up the bike box first
        cell = self.should_fill_up_bike_box()
        if cell != False:
            self.__next_pos = cell

        # If a bike stands in front of a green traffic light and sees bikes to its left, then empty the bike box first
        cell = self.should_empty_bike_box()
        if cell == None:
            # Do not move
            self.__next_pos = None
            self.velocity = 0
        elif cell != False:
            # Start moving
            self.__next_pos = cell
            self.velocity = 1

    def advance(self):
        """Advance the agent to the position that was calculated in the `step` method.
        Remove the agent from the scheduler and grid if the next position is outside the grid.
        """
        # No movement in this turn. It's either in front of a traffic light or blocked by another agent.
        if self.__next_pos == None:
            return

        elif self.model.grid.out_of_bounds(self.__next_pos):
            # Remove agent if it's out of bounds.
            self.model.grid.remove_agent(self)
            self.model.schedule.remove(self)

        elif self.model.grid.is_cell_empty(self.__next_pos):
            self.model.grid.move_agent(self, self.__next_pos)

        else:
            # Error: agent wants to move, but the destination cell is not empty -> the agent stays where it is
            pass

    def get_neighborhood(self):
        """Get index to up to `max_velocity` number of cells that are in front of the agent."""
        neighborhood = list()

        # If it's a car, look one cell further in order to compensate for the car's "main" cell being at the end of the vehicle.
        is_car = int(self.type == self.Type.CAR)

        # Return all positions of cells that are in front of the car in the direction of travel and that are inside the grid.
        for i in range(1, self.max_velocity + 1):
            pos = self.next_pos(i + is_car)

            if self.model.grid.out_of_bounds(pos):
                break

            neighborhood.append(pos)

        return neighborhood

    def next_pos(self, step):
        """Calculate index of position `step` number of cells before the agent.

        Args:
            steps: Number of cells to look forward.
        """
        x, y = self.pos
        return (self.next_x(x, step), self.next_y(y, step))

    def next_x(self, cur_x, step):
        """Calculate x coordinate from the position `step` number of cells before the agent.

        Args:
            cur_x: Current x coordinate, from which we calculate the next position.
            step: Number of cells that are looked forward
        """
        if self.direction == self.Direction.RIGHT:
            return cur_x + step
        elif self.direction == self.Direction.LEFT:
            return cur_x - step
        return cur_x

    def next_y(self, cur_y, step):
        """Calculate y coordinate from the position `step` number of cells before the agent.

        Args:
            cur_x: Current y-coordinate, from which we calculate the next position.
            step: Number of cells that are looked forward
        """
        if self.direction == self.Direction.UP:
            return cur_y - step
        elif self.direction == self.Direction.DOWN:
            return cur_y + step
        return cur_y

    def should_fill_up_bike_box(self):
        """Checks whether the car stands one cell behind a red traffic light, the next cell is occupied by another bike
        and whether there is an empty space in the bike box.

        Returns: False if the conditions are not met. Otherwise, position of the next empty cell in the bike box.
        """
        # Is it a bike and are we in bike lane mode?
        if self.type != self.Type.BIKE or not self.model.with_bike_box:
            return False

        # Is it in front of a red traffic light?
        if not self.model.is_red_light(self.next_pos(2), self.direction):
            return False

        # Is the agent already waiting and is an agent in front of it?
        if self.velocity != 0 or self.model.grid.is_cell_empty(self.next_pos(1)):
            return False

        # Is it on the main lane for bikes?
        if not self.is_on_bike_lane():
            return False

        # Has the bike box still place for another bike?
        x, y = self.pos
        if self.direction == self.Direction.UP:
            bike_box = [(x - i, y - 1) for i in range(1, 3)]
        elif self.direction == self.Direction.RIGHT:
            bike_box = [(x + 1, y - i) for i in range(1, 3)]
        elif self.direction == self.Direction.DOWN:
            bike_box = [(x + i, y + 1) for i in range(1, 3)]
        else:  # LEFT
            bike_box = [(x - 1, y + i) for i in range(1, 3)]

        # Return first empty cell
        for grid_cell in bike_box:
            if self.model.grid[grid_cell[0]][grid_cell[1]] == None:
                return grid_cell

        return False

    def should_empty_bike_box(self):
        """Checks whether the bike is standing in a bike box in front of a traffic light that has turned green.

        Returns: False if the conditions are not met. None if it's not the leftmost bike in the bike box.
        Otherwise, the position where the bike should move in the next move.
        """
        # Is it a bike and are we in bike lane mode?
        if self.type != self.Type.BIKE or not self.model.with_bike_box:
            return False

        # Is it in front of a green traffic light?
        if self.model.is_red_light(self.next_pos(1), self.direction) in [True, None]:
            return False

        # Is there no other bike to the left?
        x, y = self.pos
        if self.direction == self.Direction.UP:
            pos_left = (x - 1, y)
        elif self.direction == self.Direction.RIGHT:
            pos_left = (x, y - 1)
        elif self.direction == self.Direction.DOWN:
            pos_left = (x + 1, y)
        else:  # LEFT
            pos_left = (x, y + 1)

        # If in the cell to its left is a bike, the current agent should not move
        on_the_left = self.model.grid[pos_left[0]][pos_left[1]]
        if on_the_left != None and on_the_left.type == self.Type.BIKE:
            return None

        # Calculate difference to main lane position
        if self.direction in [self.Direction.UP, self.Direction.DOWN]:
            diff = self.pos[0]
        else:
            diff = self.pos[1]
        diff = (diff - self.model.first_street) % (
            self.model.street_width + self.model.distance_between_streets
        )

        # Move leftmost bike to bike lane in front of the stop line
        if self.direction == self.Direction.UP:
            return (x + self.model.street_width - 1 - diff, y - 1)
        elif self.direction == self.Direction.RIGHT:
            return (x + 1, y + self.model.street_width - 1 - diff)
        elif self.direction == self.Direction.DOWN:
            return (x - diff, y + 1)
        else:  # LEFT
            return (x - 1, y - diff)

    def is_on_bike_lane(self):
        """Check whether the current agent is on the bike lane."""

        # Get part of coordinate that identifies the agent's lane.
        if self.direction in [self.Direction.UP, self.Direction.DOWN]:
            u = self.pos[0]
        else:
            u = self.pos[1]
        u -= self.model.first_street

        # Check whether the agent is in the first or last lane of a street.
        block_size = self.model.street_width + self.model.distance_between_streets
        return (u % block_size) in [0, self.model.street_width - 1]

    def is_car_on_bike_box(self, pos):
        """Check whether the agent is a car and the given position is a bike box in front of a red traffic light.

        Args:
            pos: Position on the grid to check

        Returns: False or None when the conditions are not met. True if the car is not allowed to enter the given position.
        """
        if self.type != self.Type.CAR or not self.model.with_bike_box:
            return False

        x, y = pos
        bike_box_size = 1
        return self.model.is_red_light(
            (self.next_x(x, bike_box_size), self.next_y(y, bike_box_size)),
            self.direction,
        )
