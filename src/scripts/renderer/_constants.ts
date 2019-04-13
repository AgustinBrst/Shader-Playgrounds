export enum ShaderVariableType {
    int   = "int",
    float = "float",
    vec2  = "vec2",
    vec3  = "vec3",
    vec4  = "vec4",
    mat3  = "mat3",
    mat4  = "mat4",
    sampler2D = "sampler2D"
}

export enum ShaderType {
    Vertex = "vertex",
    Fragment = "fragment"
}

export enum LanguageVersion {
    GLSL_ES100 = "100 es",
    GLSL_ES300 = "300 es"
}

export enum DrawMode { Lines, Triangles }
