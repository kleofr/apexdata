def get_fia_documents(year=2024, gp='Monaco'):
    gp_str = str(gp).replace('Grand Prix', '').strip().title()
    return {
        'event': f'{year} {gp_str} Grand Prix',
        'governing_body': "Federation Internationale de l'Automobile (FIA)",
        'documents': [
            {
                'id': 'DOC-04',
                'title': 'Car Presentation Submissions and Aerodynamic Upgrades',
                'category': 'Technical Delegate',
                'time_issued': 'Friday 09:30 Local',
                'summary': 'Full technical breakdown of aerodynamic bodywork, floor edge geometries, and brake duct updates declared for this event.',
                'updates': [
                    {
                        'team': 'McLaren F1 Team',
                        'component': 'Front Wing Flap and Rear Brake Duct',
                        'type': 'Circuit Specific',
                        'description': 'Reprofiled flap cord to increase maximum downforce for street-circuit low-speed balance. Enlarged brake cooling exit ducts.'
                    },
                    {
                        'team': 'Scuderia Ferrari',
                        'component': 'Floor Body and Sidepod Undercut',
                        'type': 'Performance Evolution',
                        'description': 'Modified floor fences to improve vortex generation and maintain low-ride-height aerodynamic seal over kerbs.'
                    },
                    {
                        'team': 'Red Bull Racing',
                        'component': 'Engine Cover and Halo Winglets',
                        'type': 'Circuit Specific',
                        'description': 'High downforce cooling louvre arrangement and additional cascade winglet on rear halo pillar.'
                    },
                    {
                        'team': 'Mercedes-AMG Petronas',
                        'component': 'Front Suspension Fairing and Beam Wing',
                        'type': 'Performance Evolution',
                        'description': 'Reprofiled upper wishbone shroud to condition airflow towards floor intake leading edge.'
                    }
                ]
            },
            {
                'id': 'DOC-11',
                'title': 'Power Unit and Gearbox Component Allocations',
                'category': 'Scrutineering',
                'time_issued': 'Friday 11:00 Local',
                'summary': 'List of newly fitted internal combustion engines (ICE), turbochargers (TC), MGU-K, and energy stores (ES).',
                'updates': [
                    {
                        'team': 'McLaren (#4 L. Norris)',
                        'component': 'New Gearbox Cassette and Driveline (GBX 2/5)',
                        'type': 'Penalty Free',
                        'description': 'Exchanged gearbox assembly within prescribed allocation for the championship.'
                    },
                    {
                        'team': 'Ferrari (#16 C. Leclerc)',
                        'component': 'New Turbocharger and MGU-H (TC 2/4)',
                        'type': 'Penalty Free',
                        'description': 'Fitted second unit of seasonal pool.'
                    }
                ]
            },
            {
                'id': 'DOC-28',
                'title': 'Track Limits and Race Director Event Notes',
                'category': 'Race Direction',
                'time_issued': 'Thursday 16:00 Local',
                'summary': 'Mandatory safety instructions, maximum delta time between safety car lines, and pit exit line adherence rules.',
                'updates': [
                    {
                        'team': 'All Competitors',
                        'component': 'Pit Lane Entry and Speed Limit (60 km/h)',
                        'type': 'Sporting Regulation',
                        'description': 'Pit entrance line must remain to the right. Maximum speed of 60 km/h strictly enforced at pit entry antenna.'
                    }
                ]
            }
        ]
    }