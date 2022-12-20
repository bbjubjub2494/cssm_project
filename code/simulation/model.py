import mesa

from .metrics import model_reporters
from .agents import TrafficAgent
from .schedule import SimultaneousActivation
from mesa.datacollection import DataCollector
from mesa.model import Model
from mesa.space import Coordinate, SingleGrid

# Grid size parameters
street_width = 4
first_street = 100
distance_between_streets = 51
number_of_streets = 5
size = (
    (first_street * 2)
    + (number_of_streets * street_width)
    + ((number_of_streets - 1) * distance_between_streets)
)


class TrafficModel(Model):
    """
    Main class of our cellular automaton. It controls what happens
    in the grid globally, i.e. toggling traffic lights, creating agents and collecting data.
    """

    # Static parameters
    size = size
    max_id = 0
    number_of_streets = 5

    def __init__(
        self,
        p_new_agents: float = 0.3,
        p_slow_down: float = 0.2,
        traffic_light_phase_length: int = 10,
        bike_lane_config: int = 0,
        car_bike_ratio=0.5,
    ):
        """Initialize the model.
        Set all parameters for the run. This method is called after a reset.

        Args:
            p_new_agents: Probability that a new agents is created for each road end in each step.
            p_slow_down: Probability that an agents randomly slows down according to the third rule of Nagel Schreckenberg.
            traffic_light_phase_length: Duration of a green phase for a traffic light.
            bike_lane_config: 0 = no bike lane, shared road. 1 = with bike lane, 2 = with bike boxes/ASLs
            car_bike_ratio: probability that a newly created agent is a car.
        """
        super().__init__()

        # Store model parameters
        self.p_new_agents = p_new_agents
        self.p_slow_down = p_slow_down
        self.traffic_light_phase_length = traffic_light_phase_length
        self.with_bike_lane = bike_lane_config >= 1
        self.with_bike_box = bike_lane_config >= 2
        self.car_bike_ratio = car_bike_ratio

        # Define width and position of the street sections
        if self.with_bike_lane:
            self.street_width = street_width + 2
            self.first_street = first_street - 1
            self.distance_between_streets = distance_between_streets - 1
        else:
            self.street_width = street_width
            self.first_street = first_street
            self.distance_between_streets = distance_between_streets

        # Create Grid and Scheduler
        self.grid = SingleGrid(self.size, self.size, torus=False)
        self.schedule = SimultaneousActivation(self)

        # Create traffic lights
        num_lights = (self.size - (2 * self.first_street)) // (
            self.distance_between_streets + self.street_width
        ) + 1
        self.lights = [[(i + j) % 2 for j in range(num_lights)] for i in range(num_lights)]

        # Create an agent at each end of each road
        self.create_agents(1.0)

        # Configure data collector
        self.datacollector = DataCollector(model_reporters)

    def step(self):
        """Simulate one step of the model."""

        # Move agents to their next position
        self.schedule.step()

        # Create some new agents
        self.create_agents(self.p_new_agents)

        # Collect data
        self.datacollector.collect(self)

        # Toggle traffic lights
        if int(self.schedule.time) % self.traffic_light_phase_length == 0:
            for row in self.lights:
                for i, _ in enumerate(row):
                    row[i] ^= 1

    def create_agents(self, probability):
        """Create agents at each end of each road with the given probability.

        Args:
            probability: How likely it is at each end of each road that a new agent is created.
        """
        # For each street direction (4 * num_streets in total)
        # Add an agent at the beginning of a street
        for direction in TrafficAgent.Direction:
            for i in range(self.number_of_streets):
                if self.random.random() > probability:
                    continue

                # Choose car or bike with probability `car_bike_ratio`
                if self.random.random() < self.car_bike_ratio:
                    type = TrafficAgent.Type.CAR
                else:
                    type = TrafficAgent.Type.BIKE

                # Create a new agent with a unique ID.
                self.max_id += 1
                agent = TrafficAgent(
                    self.max_id,
                    self,
                    type,
                    direction,
                )

                # When there is a bike lane, move cars one cell towards the center
                offset = 0
                if self.with_bike_lane and agent.type == TrafficAgent.Type.CAR:
                    offset = 1

                # Add the agent to the current road in the given direction
                x = y = (
                    self.first_street
                    + (self.distance_between_streets + self.street_width) * i
                    + offset
                )
                if direction == TrafficAgent.Direction.UP:
                    x += self.street_width - 1 - (2 * offset)
                    y = self.size - 1
                elif direction == TrafficAgent.Direction.RIGHT:
                    x = 0
                    y += self.street_width - 1 - (2 * offset)
                elif direction == TrafficAgent.Direction.DOWN:
                    y = 0
                else:  # direction == LEFT
                    x = self.size - 1

                # Add agent if cell is empty
                if self.grid.is_cell_empty((x, y)) and (
                    agent.type != TrafficAgent.Type.CAR
                    or self.grid.is_cell_empty((agent.next_x(x, 1), agent.next_y(y, 1)))
                ):
                    self.grid.place_agent(agent, (x, y))
                    self.schedule.add(agent)
                else:
                    # Silently fail if an existing agent is in the way
                    # This should be rare with the longer first streets
                    pass

    def is_red_light(self, pos: Coordinate, dir: TrafficAgent.Direction):
        """Check whether the traffic light at that position in this direction has turned red.
        For each direction only the first line of cells after the stop line is evaluated. All other cells are skipped.

        Args:
            pos: Position as tuple (x, y)
            dir: Direction at which the agent is moving.

        Returns: None if the given position for this direction is not the first cell on an intersection.
        Otherwise a Boolean whether the traffic light at this position is red or not.
        """
        x, y = pos
        x -= self.first_street
        y -= self.first_street
        block_size = self.distance_between_streets + self.street_width

        # If position is not the first cell on intersection in direction of travel
        if (
            (dir == TrafficAgent.Direction.UP and y % block_size != self.street_width - 1)
            or (dir == TrafficAgent.Direction.RIGHT and x % block_size != 0)
            or (dir == TrafficAgent.Direction.DOWN and y % block_size != 0)
            or (dir == TrafficAgent.Direction.LEFT and x % block_size != self.street_width - 1)
            or not (0 <= x // block_size < self.number_of_streets)
            or not (0 <= y // block_size < self.number_of_streets)
        ):
            return None

        # `1` means the traffic light is red for left <-> right traffic
        is_horizontal_direction = int(
            dir in [TrafficAgent.Direction.LEFT, TrafficAgent.Direction.RIGHT]
        )

        return self.lights[x // block_size][y // block_size] == is_horizontal_direction
