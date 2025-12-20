# Models

Mongoose schemas.

This directory will contain all MongoDB schema definitions using Mongoose.

## Structure

Models will include:

- `User.model.ts` - User account schema
- `Reel.model.ts` - Reel data schema
- `Workspace.model.ts` - Workspace schema
- `Transcription.model.ts` - Transcription data schema
- `Summary.model.ts` - Summary data schema

Each model will:

1. Define the schema structure
2. Include validation rules
3. Define indexes for performance
4. Include instance and static methods
5. Export the Mongoose model
