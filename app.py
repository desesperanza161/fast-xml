import uuid
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:1111@localhost:5432/shablons'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
class Template(db.Model):
    __tablename__ = 'templates'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(200), nullable=False)
    xml_data = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }

class Project(db.Model):
    __tablename__ = 'projects'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(200), nullable=False)
    xml_data = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }


with app.app_context():
    db.create_all()
    print("PostgreSQL tables created (if not exist)")

@app.route('/api/templates', methods=['GET'])
def get_templates():
    templates = Template.query.order_by(Template.created_at.desc()).all()
    return jsonify([t.to_dict() for t in templates])

@app.route('/api/templates/<template_id>', methods=['GET'])
def get_template(template_id):
    template = Template.query.get(template_id)
    if not template:
        return jsonify({'error': 'Template not found'}), 404
    return template.xml_data, 200, {'Content-Type': 'application/xml'}

@app.route('/api/templates', methods=['POST'])
def create_template():
    data = request.get_json()
    if not data or 'xmlData' not in data:
        return jsonify({'error': 'No xmlData'}), 400
    name = data.get('name', f'Template_{uuid.uuid4().hex[:8]}')
    xml_data = data['xmlData']
    template = Template(name=name, xml_data=xml_data)
    db.session.add(template)
    db.session.commit()
    return jsonify(template.to_dict()), 201

@app.route('/api/templates/<template_id>', methods=['PUT'])
def update_template(template_id):
    template = Template.query.get(template_id)
    if not template:
        return jsonify({'error': 'Template not found'}), 404
    data = request.get_json()
    if 'name' in data:
        template.name = data['name']
    if 'xmlData' in data:
        template.xml_data = data['xmlData']
    db.session.commit()
    return jsonify(template.to_dict())

@app.route('/api/templates/<template_id>', methods=['DELETE'])
def delete_template(template_id):
    template = Template.query.get(template_id)
    if not template:
        return jsonify({'error': 'Template not found'}), 404
    db.session.delete(template)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


@app.route('/api/projects', methods=['GET'])
def get_projects():
    projects = Project.query.order_by(Project.created_at.desc()).all()
    return jsonify([p.to_dict() for p in projects])

@app.route('/api/projects/<project_id>', methods=['GET'])
def get_project(project_id):
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    return project.xml_data, 200, {'Content-Type': 'application/xml'}

@app.route('/api/projects', methods=['POST'])
def create_project():
    data = request.get_json()
    if not data or 'xmlData' not in data:
        return jsonify({'error': 'No xmlData'}), 400
    name = data.get('name', f'Project_{uuid.uuid4().hex[:8]}')
    xml_data = data['xmlData']
    project = Project(name=name, xml_data=xml_data)
    db.session.add(project)
    db.session.commit()
    return jsonify(project.to_dict()), 201

@app.route('/api/projects/<project_id>', methods=['PUT'])
def update_project(project_id):
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    data = request.get_json()
    if 'name' in data:
        project.name = data['name']
    if 'xmlData' in data:
        project.xml_data = data['xmlData']
    db.session.commit()
    return jsonify(project.to_dict())

@app.route('/api/projects/<project_id>', methods=['DELETE'])
def delete_project(project_id):
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    db.session.delete(project)
    db.session.commit()
    return jsonify({'message': 'Deleted'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)