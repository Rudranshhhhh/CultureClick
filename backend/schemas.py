from marshmallow import Schema, fields, validate

class RegisterSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6))
    city = fields.Str(load_default="New York")

class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)

class GuestLoginSchema(Schema):
    city = fields.Str(load_default="New York")

class SwipeSchema(Schema):
    hobby_id = fields.Str(required=True)
    action = fields.Str(required=True, validate=validate.OneOf(["like", "skip", "superlike"]))

class MemorySchema(Schema):
    hobby_id = fields.Str(required=True)
    hobby_name = fields.Str(load_default="")
    hobby_category = fields.Str(load_default="")
    hobby_emoji = fields.Str(load_default="")
    note = fields.Str(load_default="")
    rating = fields.Int(required=True, validate=validate.Range(min=1, max=5))
    photo_url = fields.Str(load_default="")
