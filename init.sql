
CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY, 
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    skills TEXT[] NOT NULL,
    location VARCHAR(100) NOT NULL,
    deadline DATE NOT NULL,
    posted_date DATE NOT NULL,
    salary_min INTEGER,
    salary_max INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_jobs_title ON jobs (title);
CREATE INDEX idx_jobs_location ON jobs (location);
CREATE INDEX idx_jobs_type ON jobs (type);
CREATE INDEX idx_jobs_skills ON jobs USING GIN (skills);
