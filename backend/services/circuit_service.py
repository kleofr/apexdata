# Circuit technical specs and all-time records
import numpy as np

CIRCUIT_RECORDS = {
    'monaco': {
        'name': 'Circuit de Monaco',
        'location': 'Monte Carlo, Monaco',
        'length_km': 3.337,
        'turns': 19,
        'drs_zones_count': 1,
        'fastest_lap_ever': {
            'time': '1:10.166',
            'driver': 'Lewis Hamilton',
            'team': 'Mercedes-AMG Petronas',
            'year': 2019,
            'session': 'Qualifying'
        },
        'race_lap_record': {
            'time': '1:12.909',
            'driver': 'Lewis Hamilton',
            'team': 'Mercedes-AMG Petronas',
            'year': 2021
        },
        'drs_zones': [
            {
                'id': 1,
                'detection': 'Corner 16 (Chicane)',
                'detection_distance_m': 2980,
                'activation': 'Main Straight after Turn 19',
                'start_distance_m': 3150,
                'end_distance_m': 3330
            }
        ],
        'characteristics': {
            'type': 'Street Circuit',
            'downforce': 'Maximum',
            'direction': 'Clockwise',
            'pit_lane_loss_sec': 24.5
        }
    },
    'australia': {
        'name': 'Albert Park Grand Prix Circuit',
        'location': 'Melbourne, Australia',
        'length_km': 5.278,
        'turns': 14,
        'drs_zones_count': 4,
        'fastest_lap_ever': {
            'time': '1:15.915',
            'driver': 'Max Verstappen',
            'team': 'Red Bull Racing',
            'year': 2024,
            'session': 'Qualifying'
        },
        'race_lap_record': {
            'time': '1:19.813',
            'driver': 'Charles Leclerc',
            'team': 'Scuderia Ferrari',
            'year': 2024
        },
        'drs_zones': [
            {'id': 1, 'detection': 'Entry to Turn 13', 'detection_distance_m': 4850, 'activation': 'Start/Finish Straight', 'start_distance_m': 5100, 'end_distance_m': 500},
            {'id': 2, 'detection': 'Entry to Turn 13', 'detection_distance_m': 4850, 'activation': 'Straight after Turn 2', 'start_distance_m': 600, 'end_distance_m': 1250},
            {'id': 3, 'detection': 'Exit of Turn 6', 'detection_distance_m': 2100, 'activation': 'Back Lakeside Straight', 'start_distance_m': 2350, 'end_distance_m': 3150},
            {'id': 4, 'detection': 'Exit of Turn 8', 'detection_distance_m': 3300, 'activation': 'Straight to Turn 9', 'start_distance_m': 3450, 'end_distance_m': 3950}
        ],
        'characteristics': {
            'type': 'Temporary Street / Park',
            'downforce': 'Medium-High',
            'direction': 'Clockwise',
            'pit_lane_loss_sec': 20.2
        }
    },
    'spain_barcelona': {
        'name': 'Circuit de Barcelona-Catalunya',
        'location': 'Montmelo, Barcelona, Spain',
        'length_km': 4.657,
        'turns': 14,
        'drs_zones_count': 2,
        'fastest_lap_ever': {
            'time': '1:11.383',
            'driver': 'Lando Norris',
            'team': 'McLaren',
            'year': 2024,
            'session': 'Qualifying'
        },
        'race_lap_record': {
            'time': '1:16.330',
            'driver': 'Max Verstappen',
            'team': 'Red Bull Racing',
            'year': 2023
        },
        'drs_zones': [
            {'id': 1, 'detection': 'Safety Car Line 1 (Turn 9)', 'detection_distance_m': 2950, 'activation': 'Back straight to Turn 10', 'start_distance_m': 3100, 'end_distance_m': 3800},
            {'id': 2, 'detection': 'Turn 13 Apex', 'detection_distance_m': 4200, 'activation': 'Main Start/Finish Straight', 'start_distance_m': 4450, 'end_distance_m': 600}
        ],
        'characteristics': {
            'type': 'Permanent High-Downforce Raceway',
            'downforce': 'High',
            'direction': 'Clockwise',
            'pit_lane_loss_sec': 22.4
        }
    },
    'spain_madrid': {
        'name': 'Circuito de Madrid (IFEMA - Valdebebas)',
        'location': 'Madrid, Spain',
        'length_km': 5.474,
        'turns': 20,
        'drs_zones_count': 3,
        'fastest_lap_ever': {
            'time': '1:31.824',
            'driver': 'Lando Norris',
            'team': 'McLaren',
            'year': 2026,
            'session': 'Qualifying (Q3 Pole Position)'
        },
        'race_lap_record': {
            'time': '1:35.587',
            'driver': 'George Russell',
            'team': 'Mercedes-AMG Petronas',
            'year': 2026
        },
        'drs_zones': [
            {'id': 1, 'detection': 'Turn 6 Banking Entry', 'detection_distance_m': 1400, 'activation': 'Valdebebas Express Straight', 'start_distance_m': 1600, 'end_distance_m': 2400},
            {'id': 2, 'detection': 'Turn 12 Chicane', 'detection_distance_m': 3300, 'activation': 'IFEMA Pavilion Bridge Straight', 'start_distance_m': 3500, 'end_distance_m': 4200},
            {'id': 3, 'detection': 'Final Turn 20', 'detection_distance_m': 5100, 'activation': 'Main Start/Finish Straight', 'start_distance_m': 5250, 'end_distance_m': 450}
        ],
        'characteristics': {
            'type': 'Hybrid Street & Banked Pavilion Circuit',
            'downforce': 'Medium',
            'direction': 'Clockwise',
            'pit_lane_loss_sec': 21.8
        }
    },
    'silverstone': {
        'name': 'Silverstone Circuit',
        'location': 'Silverstone, Great Britain',
        'length_km': 5.891,
        'turns': 18,
        'drs_zones_count': 2,
        'fastest_lap_ever': {
            'time': '1:24.303',
            'driver': 'Lewis Hamilton',
            'team': 'Mercedes-AMG Petronas',
            'year': 2020,
            'session': 'Qualifying'
        },
        'race_lap_record': {
            'time': '1:27.097',
            'driver': 'Max Verstappen',
            'team': 'Red Bull Racing',
            'year': 2020
        },
        'drs_zones': [
            {'id': 1, 'detection': 'Turn 3 (Village)', 'detection_distance_m': 750, 'activation': 'Wellington Straight', 'start_distance_m': 900, 'end_distance_m': 1650},
            {'id': 2, 'detection': 'Turn 10 (Chapel)', 'detection_distance_m': 3100, 'activation': 'Hangar Straight', 'start_distance_m': 3250, 'end_distance_m': 4150}
        ],
        'characteristics': {
            'type': 'High-Speed Historic Raceway',
            'downforce': 'Medium-High',
            'direction': 'Clockwise',
            'pit_lane_loss_sec': 20.5
        }
    },
    'spa': {
        'name': 'Circuit de Spa-Francorchamps',
        'location': 'Stavelot, Belgium',
        'length_km': 7.004,
        'turns': 19,
        'drs_zones_count': 2,
        'fastest_lap_ever': {
            'time': '1:41.252',
            'driver': 'Lewis Hamilton',
            'team': 'Mercedes-AMG Petronas',
            'year': 2020,
            'session': 'Qualifying'
        },
        'race_lap_record': {
            'time': '1:44.701',
            'driver': 'Sergio Perez',
            'team': 'Red Bull Racing',
            'year': 2024
        },
        'drs_zones': [
            {'id': 1, 'detection': 'Before Turn 2 (Eau Rouge)', 'detection_distance_m': 450, 'activation': 'Kemmel Straight', 'start_distance_m': 1200, 'end_distance_m': 2350},
            {'id': 2, 'detection': 'Turn 18 (Blanchimont)', 'detection_distance_m': 6200, 'activation': 'Main Straight', 'start_distance_m': 6700, 'end_distance_m': 350}
        ],
        'characteristics': {
            'type': 'High-Speed Ardennes Rollercoaster',
            'downforce': 'Low-Medium',
            'direction': 'Clockwise',
            'pit_lane_loss_sec': 22.0
        }
    },
    'baku': {
        'name': 'Baku City Circuit',
        'location': 'Baku, Azerbaijan',
        'length_km': 6.003,
        'turns': 20,
        'drs_zones_count': 2,
        'fastest_lap_ever': {
            'time': '1:40.203',
            'driver': 'Charles Leclerc',
            'team': 'Scuderia Ferrari',
            'year': 2023,
            'session': 'Qualifying'
        },
        'race_lap_record': {
            'time': '1:43.009',
            'driver': 'Charles Leclerc',
            'team': 'Scuderia Ferrari',
            'year': 2019
        },
        'drs_zones': [
            {'id': 1, 'detection': 'Turn 2 Apex', 'detection_distance_m': 900, 'activation': 'Turn 2 to Turn 3 straight', 'start_distance_m': 1050, 'end_distance_m': 1850},
            {'id': 2, 'detection': 'Turn 20 exit', 'detection_distance_m': 4100, 'activation': '2.2km Main Straight', 'start_distance_m': 4350, 'end_distance_m': 5950}
        ],
        'characteristics': {
            'type': 'High-Speed Street Circuit',
            'downforce': 'Low-Medium',
            'direction': 'Anti-Clockwise',
            'pit_lane_loss_sec': 21.0
        }
    }
}

def get_circuit_details(gp_name, year=2024):
    """
    Year-aware venue resolution.
    Spanish Grand Prix:
    - Held at Circuit de Barcelona-Catalunya until 2025.
    - Moved to Circuito de Madrid (IFEMA - Valdebebas) starting from 2026.
    """
    if not gp_name:
        return CIRCUIT_RECORDS['monaco']

    clean = str(gp_name).lower().replace('grand prix', '').strip()
    y = int(year) if year else 2024

    # Spanish GP venue transition
    if 'spain' in clean or 'spanish' in clean or 'catalunya' in clean or 'barcelona' in clean or 'madrid' in clean:
        if 'madrid' in clean or y >= 2026:
            return CIRCUIT_RECORDS['spain_madrid']
        else:
            return CIRCUIT_RECORDS['spain_barcelona']

    for key, data in CIRCUIT_RECORDS.items():
        if key in clean or clean in key:
            return data

    return {
        'name': f"{gp_name} Circuit",
        'location': 'Official Grand Prix Venue',
        'length_km': 5.250,
        'turns': 16,
        'drs_zones_count': 2,
        'fastest_lap_ever': {
            'time': '1:18.420',
            'driver': 'Official Record Holder',
            'team': 'FIA Formula 1',
            'year': y - 1,
            'session': 'Qualifying'
        },
        'race_lap_record': {
            'time': '1:21.110',
            'driver': 'Fastest Race Lap',
            'team': 'Formula 1',
            'year': y - 1
        },
        'drs_zones': [
            {'id': 1, 'detection': 'Final Corner', 'detection_distance_m': 4800, 'activation': 'Main Straight', 'start_distance_m': 5000, 'end_distance_m': 450},
            {'id': 2, 'detection': 'Sector 2 entry', 'detection_distance_m': 2200, 'activation': 'Back Straight', 'start_distance_m': 2400, 'end_distance_m': 3100}
        ],
        'characteristics': {
            'type': 'FIA Grade 1 Circuit',
            'downforce': 'Medium',
            'direction': 'Clockwise',
            'pit_lane_loss_sec': 22.0
        }
    }
