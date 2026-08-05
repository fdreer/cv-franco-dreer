type CvExperiencia = {
    rol: string
    empresa: string
    periodo: string
    bullets: string[]
}

type CvFormacion = {
    titulo: string
    institucion: string
    periodo: string
}

type CvInsignia = {
    titulo: string
    src: string
    href: string
}

type CvCurso = CvFormacion & {
    insignias?: CvInsignia[]
}

type CvData = {
    nombre: string
    eyebrow: string
    titulo: string
    ubicacion: string
    email: string
    idiomas: string
    links: { linkedin: string; github: string; cv_pdf: string }
    perfil: string
    experiencia: CvExperiencia[]
    formacion: CvFormacion[]
    cursos: CvCurso[]
    competencias: string[]
}
