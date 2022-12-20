from .model import TrafficModel, size, first_street
from .visualization import TrafficGrid
from mesa.visualization.modules import ChartModule
from mesa.visualization.ModularVisualization import ModularServer
from mesa.visualization.UserParam import Slider, StaticText

# Set model parameters
model_params = {
    "title": StaticText("Parameters:"),
    "bike_lane_config": Slider(
        "With bike lane / bike boxes",
        0,
        0,
        2,
        1,
        "0 = shared road, 1 = with bike lane, 2 = with bike lane and bike boxes",
    ),
    "p_new_agents": Slider(
        "Chance of new agents",
        0.3,
        0.05,
        1.0,
        0.05,
        "Chance of new vehicles per round at each entry point",
    ),
    "p_slow_down": Slider(
        "Chance of random slow down",
        0.2,
        0.0,
        1.0,
        0.05,
        "Chance of a random slow down of an agent",
    ),
    "traffic_light_phase_length": Slider(
        "Length of traffic light phases",
        20,
        5,
        60,
        5,
        "Duration of a green/red phase for a traffic light",
    ),
    "car_bike_ratio": Slider(
        "Ratio of new cars and bikes per round",
        0.5,
        0.0,
        1.0,
        0.1,
        "Ratio of cars and bikes that are created each round",
    ),
}

# Set colors of the data series in the charts
BIKE_COLOR = "orange"
CAR_COLOR = "blue"

# Initialize visualization modules
grid = TrafficGrid(size, first_street)
num_chart = ChartModule(
    [{"Label": "Cars", "Color": CAR_COLOR}, {"Label": "Bikes", "Color": BIKE_COLOR}]
)
velocity_chart = ChartModule(
    [
        {"Label": "Car average velocity", "Color": CAR_COLOR},
        {"Label": "Bike average velocity", "Color": BIKE_COLOR},
    ]
)
density_chart = ChartModule([{"Label": "Cell density", "Color": "#FF3C33"}])
flow_chart = ChartModule([{"Label": "Average flow", "Color": "#FF3C33"}])

# Start Mesa's server module
server = ModularServer(
    TrafficModel,
    [grid, num_chart, velocity_chart, density_chart, flow_chart],
    "Traffic Model",
    model_params,
)
server.port = 8521  # The default port
