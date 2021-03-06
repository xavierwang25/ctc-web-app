/** @jsx jsx */
import { jsx } from "theme-ui";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import fp from "lodash/fp";
import Highlighter from "react-highlight-words";
import * as jsPDF from "jspdf";
import "react-circular-progressbar/dist/styles.css";

import {
  makeJobSelector,
  SAVE_JOB,
  saveJob,
  uploadResume,
  UPLOAD_RESUME,
} from "../../store/jobs";
import { makeLoadingSelector } from "../../store/loading";
import {
  getMatchingKeywords,
  getSimilarKeywords,
  getMissingKeywords,
  getAutoUpdateConversions,
} from "../../utils/keyword";
import Page from "../../components/Page";
import PageTitle from "../../components/PageTitle";
import Button from "../../components/Button";
import LoadingOverlay from "../../components/LoadingOverlay";
import JobDetail from "../Jobs/JobDetail";
import CardTitle from "./CardTitle";
import EllipsisKeywords from "./EllipsisKeywords";
import Description from "./Description";
import ResumeEdit from "./ResumeEdit";
import { useThemeUI } from "theme-ui";
import AutoUpdateConfirm from "./AutoUpdateConfirm";

export default () => {
  const { id } = useParams();
  const { theme } = useThemeUI();
  const dispatch = useDispatch();
  const isSaving = useSelector(makeLoadingSelector([SAVE_JOB, UPLOAD_RESUME]));
  const job = useSelector(makeJobSelector(id));
  const [resumeText, setResumeText] = useState(job.resume_text);
  const [isEditing, setIsEditing] = useState(false);
  const [hoveredKeyword, setHoveredKeyword] = useState("");
  const [isAutoUpdateOpen, setIsAutoUpdateOpen] = useState(false);

  const matchingKeywords = getMatchingKeywords(
    job.keywords,
    job.resume_keywords
  );
  const similarKeywords = getSimilarKeywords(job.keywords, job.resume_keywords);
  const missingKeywords = getMissingKeywords(job.keywords, job.resume_keywords);

  const getSearchWord = (hoveredKeyword) => {
    const keyword = fp.find(
      { skill: hoveredKeyword.skill },
      job.resume_keywords
    );
    return keyword ? keyword.value : "";
  };

  useEffect(() => {
    setResumeText(job.resume_text);
  }, [job.resume_text]);

  const autoUpdate = async () => {
    const conversions = getAutoUpdateConversions(
      similarKeywords,
      job.resume_keywords
    );

    await dispatch(
      saveJob({
        ...job,
        resume_text: conversions.reduce(
          (acc, cur) => acc.replace(cur.from, cur.to),
          job.resume_text
        ),
      })
    );
  };

  const handleSave = async () => {
    await dispatch(saveJob({ ...job, resume_text: resumeText }));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setResumeText(job.resume_text);
    setIsEditing(false);
  };

  const handleReset = () => {
    if (!window.confirm("Are you sure to reset your resume update?")) return;
    dispatch(uploadResume(job.id));
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    doc.fromHTML(
      job.resume_text
        .split("\n")
        .map((line) => (line ? `<div>${line}</div>` : "<br></br>"))
        .join(""),
      15,
      15,
      {
        width: 170,
      }
    );
    doc.save(`${job.title}.pdf`);
  };

  return (
    <Page>
      <PageTitle>Resume Studio</PageTitle>
      <div
        sx={{
          boxShadow: "medium",
          backgroundColor: "white",
          p: 5,
          mb: 12,
        }}
      >
        <JobDetail job={job} />
      </div>
      <div
        sx={{ display: "grid", gridTemplateColumns: "2fr 3fr", gridGap: 10 }}
      >
        <div>
          <div sx={{ pl: 4, fontSize: 2, color: "darkText", mb: 2 }}>
            Resume Scorecard
          </div>
          <LoadingOverlay loading={isSaving}>
            <div sx={{ boxShadow: "medium", backgroundColor: "white", p: 6 }}>
              <div
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  py: 6,
                  mb: 5,
                }}
              >
                <CircularProgressbar
                  value={job.score * 100}
                  text={`${(job.score * 100).toFixed(2)}%`}
                  styles={buildStyles({
                    pathColor: theme.colors.primary,
                    textColor: theme.colors.primary,
                    trailColor: theme.colors.placeholder,
                  })}
                  strokeWidth={6}
                  sx={{ width: "60%" }}
                />
              </div>
              <EllipsisKeywords
                title="Matching Keywords"
                info={`${matchingKeywords.length} / ${job.keywords.length}`}
                keywords={matchingKeywords}
                onHoverKeyword={(keyword) => setHoveredKeyword(keyword)}
              />
              <EllipsisKeywords
                title="Similar Keywords"
                info={`${similarKeywords.length} / ${job.keywords.length}`}
                keywords={similarKeywords}
                onHoverKeyword={(keyword) => setHoveredKeyword(keyword)}
              />
              <EllipsisKeywords
                title="Missing Keywords"
                info={`${missingKeywords.length} / ${job.keywords.length}`}
                keywords={missingKeywords}
                onHoverKeyword={(keyword) => setHoveredKeyword(keyword)}
              />
            </div>
          </LoadingOverlay>
          <div sx={{ pl: 4, fontSize: 2, color: "darkText", mb: 2, mt: 6 }}>
            Job Description
          </div>
          <div sx={{ boxShadow: "medium", bg: "white", p: 6 }}>
            <CardTitle sx={{ mb: 4 }}>{job.title}</CardTitle>
            <Description
              description={job.description}
              keywords={[hoveredKeyword.value]}
              sx={{ mt: 2 }}
            />
          </div>
        </div>
        <div>
          <div sx={{ pl: 4, fontSize: 2, color: "darkText", mb: 2 }}>
            Resume
          </div>
          <div sx={{ minHeight: 500, boxShadow: "medium", bg: "white", p: 5 }}>
            {isEditing ? (
              <div sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button onClick={handleSave}>
                  <span sx={{ fontSize: 3, mr: 2 }}>
                    <i className="fas fa-save"></i>
                  </span>
                  Save
                </Button>
                <Button primary={false} onClick={handleCancel} sx={{ ml: 2 }}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div sx={{ display: "flex", justifyContent: "space-between" }}>
                <Button
                  onClick={() =>
                    similarKeywords.length
                      ? setIsAutoUpdateOpen(true)
                      : alert("There is no keywords to auto update.")
                  }
                >
                  Auto Update
                </Button>
                <div>
                  <Button primary={false} onClick={() => setIsEditing(true)}>
                    <i className="fas fa-pen"></i>
                  </Button>
                  <Button primary={false} sx={{ ml: 2 }} onClick={handleReset}>
                    <i className="fas fa-redo"></i>
                  </Button>
                  <Button
                    primary={false}
                    sx={{ ml: 2 }}
                    onClick={handleDownload}
                  >
                    <i className="fas fa-download"></i>
                  </Button>
                </div>
              </div>
            )}
            <LoadingOverlay loading={isSaving}>
              <div sx={{ mt: 8 }}>
                {isEditing ? (
                  <ResumeEdit
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                  />
                ) : (
                  <Highlighter
                    highlightClassName="keyword-highlight"
                    sx={{
                      "*": {
                        fontSize: 2,
                      },
                      whiteSpace: "pre-line",
                      wordBreak: "break-word",
                      mb: 0,
                      ".keyword-highlight": {
                        bg: "primary",
                        color: "white",
                      },
                    }}
                    searchWords={[getSearchWord(hoveredKeyword)]}
                    textToHighlight={job.resume_text}
                  />
                )}
              </div>
            </LoadingOverlay>
          </div>
        </div>
      </div>
      <AutoUpdateConfirm
        isOpen={isAutoUpdateOpen}
        onClose={() => setIsAutoUpdateOpen(false)}
        onConfirm={() => {
          setIsAutoUpdateOpen(false);
          autoUpdate();
        }}
      />
    </Page>
  );
};
