from .model import TrafficModel
from mesa.visualization.ModularVisualization import VisualizationElement, CHART_JS_FILE


class TrafficGrid(VisualizationElement):
    """Visualization of our street network with all agents and traffic lights displayed.
    This class acts as bridge to the front end. It passes the necessary data that is used in the frontend.
    """

    package_includes = [CHART_JS_FILE]
    local_includes = ["Model.js"]

    def __init__(self, size, first_street):
        """Initialize visualization class

        Args:
            size: size of the grid
            first_street: x and y coordinate of the beginning of the first street.
        """
        self.js_code = f"elements.push(new TrafficModel({size}, {first_street}));"

    def render(self, model: TrafficModel):
        """Return a list of all agents with their type (car or bike) and coordinates.
        Also return a list of all traffic lights and their state and whether there are bike lanes and boxes.
        """
        agents = [
            {
                "type": agent.type.value,
                "x": agent.pos[0],
                "y": agent.pos[1],
                "dir": agent.direction.value,
            }
            for agent in model.schedule.agents
        ]
        lights = [
            {
                "state": model.lights[x][y],
                "x": model.first_street + (model.distance_between_streets + model.street_width) * x,
                "y": model.first_street + (model.distance_between_streets + model.street_width) * y,
            }
            for x in range(model.number_of_streets)
            for y in range(model.number_of_streets)
        ]
        withBikeLane = model.with_bike_lane
        withBikeBox = model.with_bike_box

        return {
            "vehicles": agents,
            "traffic_lights": lights,
            "with_bike_lane": withBikeLane,
            "with_bike_box": withBikeBox,
        }
