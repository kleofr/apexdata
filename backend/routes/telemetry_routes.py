from flask import Blueprint, jsonify, request
from services.session_service import get_or_load_session, serialize_session
from services.telemetry_service import compare_driver_telemetry
from services.qualifying_service import compute_qualifying_delta

telemetry_bp = Blueprint('telemetry_bp', __name__)

@telemetry_bp.route('/api/grand-prix', methods=['GET'])
def grand_prix_endpoint():
    year = request.args.get('year', default=2024, type=int)
    gp = request.args.get('gp', default='Monaco', type=str)
    session_code = request.args.get('session', default='FP1', type=str)
    include_telemetry = request.args.get('telemetry', default='false', type=str).lower() in ('true', '1', 'yes')

    try:
        session = get_or_load_session(year, gp, session_code, load_telemetry=include_telemetry)
        data = serialize_session(session, include_telemetry=include_telemetry)
        return jsonify({
            'status': 'success',
            'params': {
                'year': year,
                'gp': gp,
                'session': session_code,
                'telemetry': include_telemetry,
            },
            'data': data,
        }), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

@telemetry_bp.route('/api/compare', methods=['GET'])
def compare_endpoint():
    year = request.args.get('year', default=2024, type=int)
    gp = request.args.get('gp', default='Monaco', type=str)
    session_code = request.args.get('session', default='Q', type=str)
    driver1_id = request.args.get('driver1', default='LEC', type=str).strip()
    driver2_id = request.args.get('driver2', default='NOR', type=str).strip()

    try:
        session = get_or_load_session(year, gp, session_code, load_telemetry=True)
        comparison_payload = compare_driver_telemetry(session, driver1_id, driver2_id, year, gp, session_code)
        return jsonify({
            'status': 'success',
            'data': comparison_payload,
        }), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

@telemetry_bp.route('/api/qualifying-delta', methods=['GET'])
def qualifying_delta_endpoint():
    year = request.args.get('year', default=2024, type=int)
    gp = request.args.get('gp', default='Monaco', type=str)
    driver_id = request.args.get('driver', default='', type=str).strip()

    try:
        session = get_or_load_session(year, gp, 'Q', load_telemetry=True)
        payload = compute_qualifying_delta(session, driver_id, year, gp)
        return jsonify({
            'status': 'success',
            'data': payload,
        }), 200
    except Exception as e:
        # Fallback to Race or FP1 session if Qualifying not available
        try:
            session_fallback = get_or_load_session(year, gp, 'R', load_telemetry=True)
            payload = compute_qualifying_delta(session_fallback, driver_id, year, gp)
            return jsonify({
                'status': 'success',
                'data': payload,
            }), 200
        except Exception as fb_err:
            return jsonify({'status': 'error', 'message': str(e)}), 400

