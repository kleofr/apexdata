from flask import Blueprint, jsonify, request
from services.circuit_service import get_circuit_details

circuit_bp = Blueprint('circuit_bp', __name__)

@circuit_bp.route('/api/circuits', methods=['GET'])
def circuits_endpoint():
    gp = request.args.get('gp', default='Monaco', type=str)
    try:
        data = get_circuit_details(gp)
        return jsonify({
            'status': 'success',
            'gp': gp,
            'data': data
        }), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400
