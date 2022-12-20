from .agents import TrafficAgent
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import TrafficModel


def get_num_vehicles(model: "TrafficModel"):
    """Get number of vehicles.

    Args:
        model: Reference to our Traffic model
    """
    return model.schedule.get_agent_count()


def get_num_cars(model: "TrafficModel"):
    """Get number of cars.

    Args:
        model: Reference to our Traffic model
    """
    return sum(a.type == TrafficAgent.Type.CAR for a in model.schedule.agents)


def get_num_bikes(model: "TrafficModel"):
    """Get number of bikes.

    Args:
        model: Reference to our Traffic model
    """
    return sum(a.type == TrafficAgent.Type.BIKE for a in model.schedule.agents)


def get_average_velocity(model: "TrafficModel", type: TrafficAgent.Type = None):
    """Calculate the average velocity of all agents.

    Args:
        model: Reference to our Traffic model
        vehicle_type: type of agents to filter
    """
    velocities = [a.velocity for a in model.schedule.agents if type is None or a.type == type]
    if len(velocities) == 0:
        return 0.0
    return sum(velocities) / len(velocities)


def get_car_average_velocity(model: "TrafficModel"):
    """Calculate average velocity of all cars.

    Args:
        model: Reference to our Traffic model
    """
    return get_average_velocity(model, type=TrafficAgent.Type.CAR)


def get_bike_average_velocity(model: "TrafficModel"):
    """Calculate average velocity of all bikes.

    Args:
        model: Reference to our Traffic model
    """
    return get_average_velocity(model, type=TrafficAgent.Type.BIKE)


def get_cell_density(model: "TrafficModel"):
    """Get density of all cells.

    Args:
        model: Reference to our Traffic model
    """
    car_cells = 4
    bike_cells = 1

    occupied_cells = car_cells * get_num_cars(model) + bike_cells * get_num_bikes(model)
    total_cells = (
        2 * model.number_of_streets * model.size * model.street_width
        - (model.number_of_streets * model.street_width) ** 2
    )
    return occupied_cells / total_cells


def get_flow(model: "TrafficModel"):
    """Calculate average flow of the model by the basic formula for traffic flow.

    Args:
        model: Reference to our Traffic model.
    """
    return get_average_velocity(model) * get_cell_density(model)


# List of all our model reporters.
model_reporters = {
    "Vehicles": get_num_vehicles,
    "Cars": get_num_cars,
    "Bikes": get_num_bikes,
    "Car average velocity": get_car_average_velocity,
    "Bike average velocity": get_bike_average_velocity,
    "Cell density": get_cell_density,
    "Average flow": get_flow,
}
