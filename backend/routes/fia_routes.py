from flask import Blueprint, jsonify, request
from services.fia_service import get_fia_documents

fia_bp = Blueprint('fia_bp', __name__)

@fia_bp.route('/api/fia-documents', methods=['GET'])
def fia_documents_endpoint():
    year = request.args.get('year', default=2024, type=int)
    gp = request.args.get('gp', default='Monaco', type=str)

    try:
        data = get_fia_documents(year=year, gp=gp)
        return jsonify({
            'status': 'success',
            'year': year,
            'gp': gp,
            'data': data
        }), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400
