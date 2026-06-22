import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import AuthPanel from "../components/AuthPanel";
import FormField from "../components/FormField";
import { saveCandidateDetails } from "../lib/api";
import useFormFields from "../hooks/useFormFields";

const initialDetails = {
  applicationNumber: "",
  email: "",
  name: "",
  dob: "",
  attendance: "",
  joinReason: "",
  primaryDepartment: "",
  secondaryDepartment: "",
  otherSocieties: "",
  recruitReason: "",
};

const profileMap = {
  applicationNumber: "application_number",
  name: "full_name",
  dob: "date_of_birth",
  attendance: "attendance",
  joinReason: "join_reason",
  primaryDepartment: "primary_department",
  secondaryDepartment: "secondary_department",
  otherSocieties: "other_societies",
  recruitReason: "recruit_reason",
};

const attendanceOptions = [
  ["", "Select one option"],
  ["only-soc-fair", "Only Society fair"],
  ["only-tech-meet", "Only Tech meet"],
  ["both", "Both"],
  ["none", "None"],
].map(([value, label]) => ({ value, label }));

const departmentOptions = [
  ["", "Select a department"],
  ["Tech", "Tech"],
  ["Design", "Design"],
  ["Marketing", "Marketing"],
  ["Content", "Content"],
  ["Media", "Media"],
].map(([value, label]) => ({ value, label }));

const topFields = [
  ["candidate-name", "name", "Name", "text", "Enter your full name"],
  ["candidate-email", "email", "Email", "email", "Enter email address"],
  [
    "application-number",
    "applicationNumber",
    "Application Number",
    "text",
    "Enter application number",
  ],
  ["dob", "dob", "Date of Birth", "date"],
  [
    "attendance",
    "attendance",
    "Did you attended the Tech meet and Society fair?",
    "select",
  ],
];

const departmentFields = [
  [
    "primary-department",
    "primaryDepartment",
    "Your Primary Department",
    "department-select",
  ],
  [
    "secondary-department",
    "secondaryDepartment",
    "Your Secondary Department",
    "department-select",
  ],
];

export default function CandidateDetails({
  registrationData,
  onBackToSignup,
  onSaved,
}) {
  const navigate = useNavigate();
  const [values, handleChange, setValues] = useFormFields(initialDetails);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setValues({
      ...initialDetails,
      email: registrationData?.email ?? "",
      ...Object.fromEntries(
        Object.entries(profileMap).map(([key, profileKey]) => [
          key,
          registrationData?.[profileKey] ?? "",
        ]),
      ),
    });
  }, [registrationData, setValues]);

  const renderField = ([id, name, label, type, placeholder]) => (
    <FormField
      id={id}
      key={id}
      label={label}
      name={name}
      onChange={handleChange}
      options={
        type === "select"
          ? attendanceOptions
          : type === "department-select"
            ? departmentOptions
            : undefined
      }
      placeholder={placeholder}
      required
      type={type === "select" || type === "department-select" ? undefined : type}
      value={values[name]}
    />
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setStatus("");

    const token = registrationData?.accessToken;

    if (!token) {
      setLoading(false);
      setError("Please log in again before saving candidate details.");
      return;
    }

    try {
      const response = await saveCandidateDetails(
        values,
        token,
      );

      const successMessage = "Your details have been saved successfully.";

      setStatus(successMessage);
      onSaved?.(response);
      navigate(response.redirectTo || "/dashboard", {
        replace: true,
        state: { successMessage },
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPanel
      className="candidate-panel"
      copy="Complete the profile information needed for the recruitment process."
      id="candidate-title"
      pageClass="candidate-page"
      title="Candidate details"
    >
      <form className="auth-form candidate-form" onSubmit={handleSubmit}>
        <div className="details-grid">{topFields.map(renderField)}</div>

        <FormField
          as="textarea"
          id="join-reason"
          label="Why do you want to join MLSC?"
          name="joinReason"
          onChange={handleChange}
          placeholder="Write your reason"
          required
          rows="4"
          value={values.joinReason}
        />

        <div className="details-grid">{departmentFields.map(renderField)}</div>

        <FormField
          id="other-societies"
          label="Which other Societies you are currently in Thapar except MLSC?"
          name="otherSocieties"
          onChange={handleChange}
          placeholder="List other societies"
          required
          rows="3"
          value={values.otherSocieties}
        />

        <FormField
          as="textarea"
          id="recruit-reason"
          label="Why should we recruit you?"
          name="recruitReason"
          onChange={handleChange}
          placeholder="Share why you are a strong fit"
          required
          rows="4"
          value={values.recruitReason}
        />

        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              onBackToSignup ? onBackToSignup() : navigate("/signup")
            }
          >
            Back to signup
          </button>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Saving..." : "Save candidate details"}
          </button>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        {status ? <p className="form-success">{status}</p> : null}
      </form>
    </AuthPanel>
  );
}
